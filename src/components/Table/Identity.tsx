"use client";

import { DataItem, Categories } from "../../app/dataUtilities";

interface Props {
  data: Array<DataItem>;
  categories: Array<Categories>;
}

const Identity = (props: Props) => {
  const identityHeaders = props.categories.map((category, index) => (
    <span key={index}>{category.title}</span>
  ));

  const identityRows = props.data.map((item: DataItem | any, index) => (
    <div key={index}>
      {props.categories.map((category: Categories, index) => (
        <span key={index}>{item[category.field]}</span>
      ))}
    </div>
  ));

  return (
    <div>
      <div>{identityHeaders}</div>
      <div>{identityRows}</div>
    </div>
  );
};

Identity.displayName = "Identity";

export default Identity;
