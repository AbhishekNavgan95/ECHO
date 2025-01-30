import React, { useState } from "react";
import SignupForm from "../cors/Auth/SignUpForm";
import LoginForm from "../cors/Auth/LoginForm";
import signup from "../../assets/Images/signup.webp";
import HighlightText from "../common/HighlightText";
import login from "../../assets/Images/login.webp";
import frame from "../../assets/Images/frame.png";
import { useSelector } from "react-redux";
import { SyncLoader } from "react-spinners";

const Tamplate = ({ formType }) => {
  const loading = useSelector((state) => state.auth.loading);
  const [accountType, setAccountType] = useState("Student");

  return (
    <div className="flex justify-center  min-h-[calc(100vh-5rem)] items-center ">
      {loading ? (
          <SyncLoader color="#E7C009" />
      ) : (
        <div className=" max-w-maxContent w-full mx-auto py-10 gap-10 items-center justify-between flex flex-col xl:flex-row">
          <div className="flex flex-col gap-3 xl:w-2/5 md:w-8/12 w-11/12 ">
            {formType === "login" ? (
              <LoginForm
                title={"Welcome Back"}
                description1={"Build skills for today, tomorrow, and beyond."}
                description2={"Education to future-proof your career."}
              />
            ) : (
              <SignupForm
                accountType={accountType}
                setAccountType={setAccountType}
                title={
                  "Join the millions learning to code with ECHO for free"
                }
                description1={"Build skills for today, tomorrow, and beyond."}
                description2={"Education to future-proof your career."}
              />
            )}
          </div>

          <div className="px-5">
            <div className="relative">
              <img
                className="object-cover border-2 shadow-2xl border-white relative z-[2] w-full"
                src={!(formType === "login")? signup : login}
                loading="lazy" 
                alt="login"
              />
              <img
                src={frame}
                className="w-full h-full bg-white z-[1] absolute top-2 left-2"
                loading="lazy" 
                alt="frame"
              />
              <div className="w-full h-full bg-richblack-500 top-0 z-[1] blur-3xl absolute"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tamplate;
