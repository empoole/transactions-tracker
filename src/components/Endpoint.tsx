"use client";

import React, { useState } from "react";
import Button from "plaid-threads/Button";
import Table from "./Table";
import Error from "./Error";
import {
  DataItem,
  Categories,
  ErrorDataItem,
  Data,
} from "../app/dataUtilities";

interface Props {
  endpoint: string;
  name?: string;
  categories: Array<Categories>;
  schema: string;
  description: string;
  transformData: (arg: any) => Array<DataItem>;
}

const Endpoint = (props: Props) => {
  const [showTable, setShowTable] = useState(false);
  const [transformedData, setTransformedData] = useState<Data>([]);
  const [pdf, setPdf] = useState<string | null>(null);
  const [error, setError] = useState<ErrorDataItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getData = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/${props.endpoint}`, { method: "GET" });
    const data = await response.json();
    if (data.error != null) {
      setError(data.error);
      setIsLoading(false);
      return;
    }
    setTransformedData(props.transformData(data)); // transform data into proper format for each individual product
    if (data.pdf != null) {
      setPdf(data.pdf);
    }
    setShowTable(true);
    setIsLoading(false);
  };

  return (
    <>
      <div>
        <div>
          <Button small centered wide secondary onClick={getData}>
            {isLoading ? "Loading..." : `Refresh transactions`}
          </Button>
        </div>
      </div>
      {showTable && (
        <div className="w-full mt-12">
          <p className="text-xl pb-3 flex items-center">
            <i className="fas fa-list mr-3"></i> Latest Transactions
          </p>

          <Table
            categories={props.categories}
            data={transformedData}
            isIdentity={props.endpoint === "identity"}
          />
        </div>
      )}
      {error != null && <Error error={error} />}
    </>
  );
};

Endpoint.displayName = "Endpoint";

export default Endpoint;
