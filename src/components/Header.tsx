"use client";

import { useContext, useState } from "react";
import Callout from "plaid-threads/Callout";
import Button from "plaid-threads/Button";
import InlineLink from "plaid-threads/InlineLink";

import Link from "./Link";
import Context from "../context/context";

const Header = () => {
  const {
    itemId,
    accessToken,
    linkToken,
    linkSuccess,
    isItemAccess,
    backend,
    linkTokenError,
  } = useContext(Context);

  const [showTokenDetails, setShowTokenDetails] = useState(false);

  return (
    <div>
      <h1 className="text-3xl text-black pb-6">Plaid Transactions</h1>

      {!linkSuccess ? (
        <>
          <h4>A sample end-to-end integration with Plaid</h4>
          {/* message if backend is not running and there is no link token */}
          {!backend ? (
            <Callout warning>
              Unable to fetch link_token: please make sure your backend server
              is running and that your .env file has been configured with your
              <code>PLAID_CLIENT_ID</code> and <code>PLAID_SECRET</code>.
            </Callout>
          ) : /* message if backend is running and there is no link token */
          linkToken == null && backend ? (
            <Callout warning>
              <div>
                Unable to fetch link_token: please make sure your backend server
                is running and that your .env file has been configured
                correctly.
              </div>
              <div>
                If you are on a Windows machine, please ensure that you have
                cloned the repo with{" "}
                <InlineLink
                  href="https://github.com/plaid/quickstart#special-instructions-for-windows"
                  target="_blank"
                >
                  symlinks turned on.
                </InlineLink>{" "}
                You can also try checking your{" "}
                <InlineLink
                  href="https://dashboard.plaid.com/activity/logs"
                  target="_blank"
                >
                  activity log
                </InlineLink>{" "}
                on your Plaid dashboard.
              </div>
              <div>
                Error Code: <code>{linkTokenError.error_code}</code>
              </div>
              <div>
                Error Type: <code>{linkTokenError.error_type}</code>{" "}
              </div>
              <div>Error Message: {linkTokenError.error_message}</div>
            </Callout>
          ) : linkToken === "" ? (
            <div>
              <Button large disabled>
                Loading...
              </Button>
            </div>
          ) : (
            <div>
              <Link />
            </div>
          )}
        </>
      ) : (
        <>
          {
            <>
              {isItemAccess ? (
                <h4>Account linked successfully.</h4>
              ) : (
                <h4>
                  <Callout warning>
                    Unable to create an item. Please check your backend server
                  </Callout>
                </h4>
              )}
              <div className="my-4">
                <button
                  className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white px-2 border border-blue-500 hover:border-transparent rounded"
                  onClick={() => setShowTokenDetails(!showTokenDetails)}
                >
                  {showTokenDetails ? `Hide` : `Show`} OAuth connection details
                </button>
                {showTokenDetails && (
                  <div>
                    <p>
                      <span>item_id: </span>
                      <span>{itemId}</span>
                    </p>

                    <p>
                      <span>access_token: </span>
                      <span>{accessToken}</span>
                    </p>
                  </div>
                )}
              </div>
            </>
          }
        </>
      )}
    </div>
  );
};

Header.displayName = "Header";

export default Header;
