import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { MdArrowBackIos, MdDisabledByDefault } from "react-icons/md";
import { getPasswordResetToken } from "../services/operations/authAPI";
import { SyncLoader } from "react-spinners";
import ActionButton from "../components/common/ActionButton";

const ResetPassword = () => {
  const [showPass, setShowPass] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [mailSent, setMailSent] = useState(false);
  const loading = useSelector((state) => state.auth.loading);
  const dispatch = useDispatch();

  const handleOnSubmit = (e) => {
    e.preventDefault();
    getPasswordResetToken(email, setEmailSent, dispatch)
    setMailSent(true);
  };

  return (
    <form onSubmit={handleOnSubmit} className="">
      <div className="flex justify-center  min-h-[calc(100vh-5rem)] items-center">
        {loading ? (
          <SyncLoader color="#E5915C" />
        ) : (
          <div className="w-10/12 md:w-8/12 lg:w-6/12 xl:w-3/12 flex flex-col gap-5">
            <p className="text-2xl md:text-3xl xl:text-4xl font-bold text-richblack-5 ">
              {!mailSent ? "Reset Your Password." : "Check Your Email."}
            </p>
            <div className="md:text-xl font-semibold text-richblack-300">
              {!mailSent ? (
                <div className="">
                  <p>
                    Have no fear. we'll email you instructions to reset your
                    password. If you dont have access to your email we can try
                    account recovery
                  </p>
                </div>
              ) : (
                <div>
                  <p>We have sent the reset email to {email}</p>
                </div>
              )}
            </div>
            {!emailSent ? (
              <div className="flex flex-col ">
                <label className="text-richblack-5 my-3">Email Address</label>
                <div className="flex shadow-sm items-center shadow-richblack-300 rounded-lg overflow-hidden">
                  <input
                    className="hover:outline-none w-full text-richblack-5 focus:outline-none py-3 px-4 md:text-xl bg-richblack-800"
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : null}
            <ActionButton
              type="submit"
              active
            >
              {!mailSent ? "Reset Password" : "Resend Email"}
            </ActionButton>
            <Link to="/login" className="  items-center text-richblack-100 hover:text-richblack-5 focus:text-richblack-5 transition-all duration-200">
              <div className=" flex gap-3 items-center">
                <MdArrowBackIos />
                Back to Log in
              </div>
            </Link>
          </div>
        )}
      </div>
    </form>
  );
};

export default ResetPassword;
