"use client";

import { DataItem, Categories } from "../../app/dataUtilities";
import Identity from "./Identity";

interface Props {
  data: Array<DataItem>;
  categories: Array<Categories>;
  isIdentity: boolean;
}

const Table = (props: Props) => {
  const maxRows = 15;

  const currencyRows = ["Amount"];

  const USDFormat = (num: number): string => {
    let sign = "";
    if (num >= 0) {
      sign += "$";
    } else {
      sign += "-$";
      num = Math.abs(num);
    }
    return sign + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
  };

  // regular table
  const headers = props.categories.map((category, index) => (
    <th key={index}>{category.title}</th>
  ));

  const rows = props.data
    .map((item: DataItem | any, index) => (
      <tr key={index}>
        {props.categories.map((category: Categories, index) => {
          let cellValue = item[category.field];
          if (currencyRows.includes(category.title)) {
            let currencyVal = item[category.field].split(" ");
            cellValue = USDFormat(parseFloat(currencyVal[1]));
          }

          return (
            <td key={index} className="text-left py-3 px-4">
              {cellValue}
            </td>
          );
        })}
      </tr>
    ))
    .slice(0, maxRows);

  return props.isIdentity ? (
    <Identity data={props.data} categories={props.categories} />
  ) : (
    <div className="bg-white overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-800 text-white">
          <tr className="text-left py-3 px-4 uppercase font-semibold text-sm">
            {headers}
          </tr>
        </thead>
        <tbody className="text-gray-700">{rows}</tbody>
      </table>
    </div>
  );
};

Table.displayName = "Table";

export default Table;
