import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdArrowBackIos } from "react-icons/md";
import { TiArrowSync } from "react-icons/ti";
import OTPInput from "react-otp-input";
import { signUp } from "../services/operations/authAPI";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "../services/operations/authAPI";
import { Link } from "react-router-dom";
import { SyncLoader } from "react-spinners";
import ActionButton from "../components/common/ActionButton";

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const loading = useSelector((state) => state.auth.loading);
  const signUpData = useSelector((state) => state.auth.signupData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!signUpData) {
      navigate("/signup")
    }
  }, []);

  const handleOnSubmit = (e) => {
    e.preventDefault();

    const {
      accountType,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    } = signUpData;

    signUp(
      accountType,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      otp,
      navigate, dispatch
    )
  };

  return (
    <div className="text-richblack-5 flex justify-center items-center min-h-[calc(100vh-5rem)] w-10/12 md:w-8/12 lg:w-6/12 xl:w-5/12 flex-col gap-5 mx-auto">
      <form onSubmit={handleOnSubmit}>
        {loading ? (
          <SyncLoader color="#E7C009" />
        ) : (
          <div className="w-full">
            <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold">Verify Email</h1>
            <div className="py-5">
              <p className="text-xl text-richblack-300">
                A varification code has been sent to your email
              </p>
            </div>
            <div className="text-richblack-5 w-full flex flex-col gap-3">
              <OTPInput
                value={otp}
                onChange={setOtp}
                numInputs={6}
                containerStyle="flex justify-between gap-3"
                renderInput={(props) => <input {...props}
                  className="w-full px-5 lg:px-7 rounded-lg py-3 lg:py-5 border  bg-richblack-800 border-richblack-600 hover:outline text-richblack-900 "
                />}
              />
              <ActionButton active>
                Verify Email
              </ActionButton>
            </div>
            <div className="my-3 flex items-center text-md justify-between">
              <Link to={"/login"} className=" text-richblack-300 hover:text-richblack-5 focus:text-richblack-5 transition-all duration-200">
                <p className="  items-center flex">
                  <MdArrowBackIos /> Back to Login
                </p>
              </Link>
              <button className="flex items-center gap-2 text-richblack-300 focus:text-richblack-5 hover:text-richblack-5 transition-all duration-200" onClick={() => dispatch(sendOtp(signUpData.email))}>
                <TiArrowSync /> Resent OTP
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default VerifyEmail;
