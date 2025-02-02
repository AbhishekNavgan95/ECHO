import React from "react";
import { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { setProgress } from "../../../slices/loadingBarSlice";
import { useDispatch } from "react-redux";
import { setSignupData } from "../../../slices/authSlice";
import { sendOtp } from "../../../services/operations/authAPI";
import ActionButton from "../../common/ActionButton";

const SignupForm = ({
  accountType,
  setAccountType,
  title,
  description1,
  description2,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // account type
  // const [accountType, setAccountType] = useState("Student");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const { firstName, lastName, email, password, confirmPassword } = formData;

  const handleOnChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords Do Not Match");
      return;
    }

    const signupData = {
      ...formData,
      accountType,
    };

    // Setting signup data to state
    // To be used after otp verification
    dispatch(setSignupData(signupData));
    // Send OTP to user for verification
    dispatch(sendOtp(formData.email, navigate, dispatch));

    // Reset
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    // setAccountType(ACCOUNT_TYPE.STUDENT)
  };

  return (
    <div>
      <form
        className="flex flex-col gap-2 justify-center"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-bold text-richblack-5">{title}</h2>
          <p className="md:text-xl flex flex-col text-richblack-300 my-2">
            <span>{description1}</span>
            <span>{description2}</span>
          </p>
        </div>

        {/* acccounttype */}
        <div className="bg-richblack-800 p-1 overflow-hidden relative rounded-full text-richblack-5 w-max my-3 flex gap-3 shadow shadow-richblack-300">
          <div
            onClick={() => setAccountType("Student")}
            className={

              `px-5 py-2  cursor-pointer rounded-full relative z-[2] transition-color duration-300 text-richblack-5 ${accountType === "Student" ? "text-richblack-900" : null}`
            }
          >
            Student
          </div>
          <div
            onClick={() => setAccountType("Instructor")}
            className={
              `px-5 py-2 cursor-pointer rounded-full relative z-[2] transition-color duration-300 text-richblack-5 ${accountType === "Instructor" ? "text-richblack-900" : null}`
            }
          >
            Intructor
          </div>
          <div className={`absolute inset-0 bg-yellow-100 rounded-full transition-all duration-300 ${accountType === "Student" ? "translate-x-[-50%]" : "translate-x-[50%]"}`}></div>
        </div>
        {/* name */}
        <div className="flex flex-col gap-3">

          <div className="flex flex-col md:flex-row gap-2 md:gap-5 justify-between">
            <div className="flex flex-col gap-2 w-full">
              <label
                htmlFor="firstName"
                className="font-semibold text-richblack-5"
              >
                First Name
              </label>
              <input
                required
                className="w-full py-3 px-3 md:text-xl shadow-sm shadow-richblack-300 bg-richblack-800 text-richblack-5 rounded-lg focus:outline-none"
                type="text"
                placeholder="First Name"
                onChange={handleOnChange}
                name="firstName"
                value={FormData.firstName}
                id="firstName"
              />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="lastName" className="font-semibold text-richblack-5">
                Last Name
              </label>
              <input
                required
                className="w-full py-3 px-3 md:text-xl bg-richblack-800 shadow-sm shadow-richblack-300 text-richblack-5 rounded-lg focus:outline-none"
                type="text"
                placeholder="Last Name"
                onChange={handleOnChange}
                name="lastName"
                value={FormData.lastName}
                id="lastName"
              />
            </div>
          </div>
          {/* email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-semibold text-richblack-5">
              Enter Email <sup>*</sup>
            </label>
            <input
              required
              className="w-full py-3 px-3 md:text-xl shadow-sm shadow-richblack-300 bg-richblack-800 text-richblack-5 rounded-lg focus:outline-none"
              type="email"
              placeholder="Email"
              onChange={handleOnChange}
              name="email"
              value={FormData.email}
              id="email"
            />
          </div>
          {/* passowrd */}
          <div className="flex flex-col md:flex-row md:gap-5 gap-2">
            <div className="flex flex-col gap-2 w-full">
              <label className="font-semibold  text-richblack-5" htmlFor="password">
                Password
              </label>
              <div className="flex items-center shadow-sm shadow-richblack-300 overflow-hidden rounded-lg">
                <input
                  required
                  placeholder="password"
                  className="w-full py-3 px-3 md:text-xl bg-richblack-800 text-richblack-5 focus:outline-none "
                  type={showPass === true ? "text" : "password"}
                  autoComplete=""
                  onChange={handleOnChange}
                  name="password"
                  value={FormData.password}
                  id="password"
                />
                <span
                  className="px-3 py-4 md:text-xl bg-richblack-800 text-richblack-5 hover:cursor-pointer"
                  onClick={() => {
                    setShowPass((prev) => !prev);
                  }}
                >
                  {!(showPass === true) ? <FaRegEye /> : <FaRegEyeSlash />}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <label
                className="font-semibold  text-richblack-5"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <div className="flex items-center shadow-sm shadow-richblack-300 overflow-hidden rounded-lg">
                <input
                  required
                  placeholder="cofirm password"
                  className="w-full py-3 px-3 md:text-xl bg-richblack-800 text-richblack-5 focus:outline-none "
                  type={showConfirmPass === true ? "text" : "password"}
                  autoComplete=""
                  onChange={handleOnChange}
                  name="confirmPassword"
                  value={FormData.confirmPassword}
                  id="confirmPassword"
                />
                <span
                  className="px-3 py-4 md:text-xl bg-richblack-800 text-richblack-5 hover:cursor-pointer"
                  onClick={() => {
                    setShowConfirmPass((prev) => !prev);
                  }}
                >
                  {!(showConfirmPass === true) ? <FaRegEye /> : <FaRegEyeSlash />}
                </span>
              </div>
            </div>
          </div>

          {/* button */}
          <ActionButton
            type="submit"
            active
          onClick={()=>{dispatch(setProgress(60))}}
          >
            Create Account
          </ActionButton>

        </div>
      </form >
    </div >
  );
};

export default SignupForm;
