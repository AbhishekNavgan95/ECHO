import React from "react";

const HighlightText = ({ text, style }) => {
  return (
    <span className={`bg-gradient-to-br from-yellow-400 to-yellow-200 text-transparent bg-clip-text capitalize font-bold ${style}`}>
      {" "}
      {text}
      {" "} 
    </span>
  );
};

export default HighlightText;
