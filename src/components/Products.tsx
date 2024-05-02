"use client";
import { useContext } from "react";

import Endpoint from "./Endpoint";
import Context from "../context/context";
import ProductTypesContainer from "./ProductTypesContainer";
import {
  transactionsCategories,
  transformTransactionsData,
} from "../app/dataUtilities";

const Products = () => {
  const { products } = useContext(Context);
  return (
    <ProductTypesContainer>
      {products.includes("transactions") && (
        <Endpoint
          endpoint="transactions"
          name="Transactions"
          categories={transactionsCategories}
          schema="/transactions/sync/"
          description="Retrieve transactions or incremental updates for credit and depository accounts."
          transformData={transformTransactionsData}
        />
      )}
    </ProductTypesContainer>
  );
};

Products.displayName = "Products";

export default Products;
