import React from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setProgress } from "../../slices/loadingBarSlice";

const CtaButton = ({ children, active, linkTo }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  return (
    <div onClick={() => {
      navigate(linkTo);
      dispatch(setProgress(100))
    }}>
      <div
        className={
          `text-center cursor-pointer w-max flex items-center px-4 py-2 md:px-4 rounded-md text-sm md:text-base active:scale-95 focus:scale-95 transition-all duration-200 shadow-sm shadow-richblack-300
          ${active 
            ? "bg-yellow-100 hover:bg-yellow-300 focus:hover:bg-yellow-300 text-black " 
            : "bg-richblack-700 hover:bg-richblack-800 focus:bg-richblack-800 text-richblack-25"}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default CtaButton;