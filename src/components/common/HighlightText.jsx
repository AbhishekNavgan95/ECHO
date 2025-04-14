import React from "react";

const HighlightText = ({ text, style }) => {
  return (
    <span className={`bg-gradient-to-br from-[#E7C009] to-[#e8d584] text-transparent bg-clip-text capitalize font-bold ${style}`}>
      {" "}
      {text}
      {" "} 
    </span>
  );
};

export default HighlightText;
