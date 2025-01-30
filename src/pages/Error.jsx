import React from "react";
import { TypeAnimation } from "react-type-animation";
import lost from "../assets/Images/lost.png"
import { MdArrowBack } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import HighLightText from "../components/common/HighlightText"

const Error = () => {

  const navigate = useNavigate();

  return (
    <div className="bg-richblack-900   max-w-maxContent mx-auto min-h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-5 lg:gap-10 justify-center items-center py-10 px-10">
      <img loading="lazy"  className="object-cover max-w-1/2move-circle  max-w-[300px] lg:max-w-[500px]" src={lost} alt="lost" />
      <div className="text-richblack-5 max-w-1/2  flex flex-col text-center lg:text-start items-center lg:items-start gap-3">
        <HighLightText style={"text-6xl font-edu-sa font-bold"} text={"404 NOT FOUND"} />
        <h3 className="text-4xl font-edu-sa">Lost in the Library ?</h3>
        <p className="text-lg text-richblack-300 font-mono">Seems like this page is off exploring its own lessons. Let's head back to the main chapters of our site. </p>
        <p onClick={() => navigate("/")} className="flex font-mono cursor-pointer gap-3 hover:gap-5 transition-all duration-300 text-yellow-100 hover:text-richblack-900 hover:bg-yellow-100 border w-max py-2 px-4 rounded-full items-center"><MdArrowBack />Back to Home</p>
      </div>
    </div>
  );
};

export default Error;
