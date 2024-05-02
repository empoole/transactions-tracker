"use client";

interface Props {
  children?: React.ReactNode | Array<React.ReactNode>;
}

const TypeContainer: React.FC<Props> = (props) => <div>{props.children}</div>;

TypeContainer.displayName = "TypeContainer";

export default TypeContainer;
