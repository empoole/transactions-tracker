import os
import json
import time
from datetime import date, timedelta
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from dotenv import load_dotenv
import plaid
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.model.auth_get_request import AuthGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.link_token_create_request_statements import LinkTokenCreateRequestStatements
from plaid.api import plaid_api

load_dotenv()

app = FastAPI()

# Fill in your Plaid API keys - https://dashboard.plaid.com/account/keys
PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
PLAID_SECRET = os.getenv('PLAID_SECRET')
# Use 'sandbox' to test with Plaid's Sandbox environment (username: user_good,
# password: pass_good)
# Use `development` to test with live users and credentials and `production`
# to go live
PLAID_ENV = os.getenv('PLAID_ENV', 'sandbox')
# PLAID_PRODUCTS is a comma-separated list of products to use when initializing
# Link. Note that this list must contain 'assets' in order for the app to be
# able to create and retrieve asset reports.
PLAID_PRODUCTS = os.getenv('PLAID_PRODUCTS', 'transactions').split(',')

# PLAID_COUNTRY_CODES is a comma-separated list of countries for which users
# will be able to select institutions from.
PLAID_COUNTRY_CODES = os.getenv('PLAID_COUNTRY_CODES', 'US').split(',')

host = plaid.Environment.Sandbox

if PLAID_ENV == 'sandbox':
    host = plaid.Environment.Sandbox

if PLAID_ENV == 'development':
    host = plaid.Environment.Development

if PLAID_ENV == 'production':
    host = plaid.Environment.Production

def empty_to_none(field):
    value = os.getenv(field)
    if value is None or len(value) == 0:
        return None
    return value

# Parameters used for the OAuth redirect Link flow.
#
# Set PLAID_REDIRECT_URI to 'http://localhost:3000/'
# The OAuth redirect flow requires an endpoint on the developer's website
# that the bank website should redirect to. You will need to configure
# this redirect URI for your client ID through the Plaid developer dashboard
# at https://dashboard.plaid.com/team/api.
PLAID_REDIRECT_URI = empty_to_none('PLAID_REDIRECT_URI')

configuration = plaid.Configuration(
    host=host,
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
        'plaidVersion': '2020-09-14'
    }
)

api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

products = []
for product in PLAID_PRODUCTS:
    products.append(Products(product))


# We store the access_token in memory - in production, store it in a secure
# persistent data store.
access_token = None
# The payment_id is only relevant for the UK Payment Initiation product.
# We store the payment_id in memory - in production, store it in a secure
# persistent data store.
# payment_id = None
# The transfer_id is only relevant for Transfer ACH product.
# We store the transfer_id in memory - in production, store it in a secure
# persistent data store.
transfer_id = None

item_id = None


@app.get("/")
def read_root():
  return {"Hello": "World"}


@app.route('/api/info', methods=['POST'])
def info(self):
    global access_token
    global item_id
    return JSONResponse(content=jsonable_encoder({
        'item_id': item_id,
        'access_token': access_token,
        'products': PLAID_PRODUCTS
    }))


##############
# AUTH STUFF #
##############

@app.route('/api/create_link_token', methods=['POST'])
def create_link_token(self):
    try:
        request = LinkTokenCreateRequest(
            products=products,
            client_name="Plaid Quickstart",
            country_codes=list(map(lambda x: CountryCode(x), PLAID_COUNTRY_CODES)),
            language='en',
            user=LinkTokenCreateRequestUser(
                client_user_id=str(time.time())
            )
        )
        if PLAID_REDIRECT_URI!=None:
            request['redirect_uri']=PLAID_REDIRECT_URI
        if Products('statements') in products:
            statements=LinkTokenCreateRequestStatements(
                end_date=date.today(),
                start_date=date.today()-timedelta(days=30)
            )
            request['statements']=statements
    # create link token
        response = client.link_token_create(request)
        return JSONResponse(content=jsonable_encoder({
            'expiration': response['expiration'],
            'link_token': response['link_token'],
            'request_id': response['request_id']
        }))
    except plaid.ApiException as e:
        print(e)
        return json.loads(e.body)


# Exchange token flow - exchange a Link public_token for
# an API access_token
# https://plaid.com/docs/#exchange-token-flow


@app.route('/api/set_access_token', methods=['POST'])
async def get_access_token(request: Request):
    global access_token
    global item_id
    global transfer_id

    # request_body = await request.json()
    async with request.form() as form:
      public_token = form['public_token']
    try:
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token)
        exchange_response = client.item_public_token_exchange(exchange_request)
        access_token = exchange_response['access_token']
        item_id = exchange_response['item_id']
        return JSONResponse(content=jsonable_encoder({
            'access_token': exchange_response['access_token'],
            'item_id' : exchange_response['item_id'],
            'request_id' : exchange_response['request_id']
        })) 
    except plaid.ApiException as e:
        return json.loads(e.body)


# Retrieve ACH or ETF account numbers for an Item
# https://plaid.com/docs/#auth


@app.route('/api/auth', methods=['GET'])
def get_auth(self):
    try:
       request = AuthGetRequest(
            access_token=access_token
        )
       response = client.auth_get(request)
       pretty_print_response(response.to_dict())
       return JSONResponse(content=jsonable_encoder(response)) 
    except plaid.ApiException as e:
        error_response = format_error(e)
        return JSONResponse(content=jsonable_encoder(error_response)) 

##################
# END AUTH STUFF #
##################

@app.route('/api/transactions', methods=['GET'])
def get_transactions(self):
    # Set cursor to empty to receive all historical updates
    cursor = ''

    # New transaction updates since "cursor"
    added = []
    modified = []
    removed = [] # Removed transaction ids
    has_more = True
    try:
        # Iterate through each page of new transaction updates for item
        while has_more:
            request = TransactionsSyncRequest(
                access_token=access_token,
                cursor=cursor,
            )
            response = client.transactions_sync(request).to_dict()
            # Add this page of results
            added.extend(response['added'])
            modified.extend(response['modified'])
            removed.extend(response['removed'])
            has_more = response['has_more']
            # Update cursor to the next cursor
            cursor = response['next_cursor']
            pretty_print_response(response)

        # Return the 8 most recent transactions
        latest_transactions = sorted(added, key=lambda t: t['date'])[-8:]
        return JSONResponse(content=jsonable_encoder({
            'latest_transactions': latest_transactions}))

    except plaid.ApiException as e:
        error_response = format_error(e)
        return JSONResponse(content=jsonable_encoder(error_response))
    

##################
# UTILS          #
##################

def pretty_print_response(response):
  print(json.dumps(response, indent=2, sort_keys=True, default=str))

def format_error(e):
    response = json.loads(e.body)
    return {'error': {'status_code': e.status, 'display_message':
                      response['error_message'], 'error_code': response['error_code'], 'error_type': response['error_type']}}