import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { apiConnector } from "../../services/apiconnector";
import { contactusEndpoint } from "../../services/apis";
import cuntryCodes from "../../data/countrycode.json";
import ActionButton from "./ActionButton";
import toast from "react-hot-toast";
import { setProgress } from "../../slices/loadingBarSlice";
import { useDispatch } from "react-redux";

const ContactUsForm = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const {
    setValue,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessfull },
  } = useForm();

  useEffect(() => {
    if (isSubmitSuccessfull) {
      reset({
        email: "",
        firstName: "",
        lastName: "",
        message: "",
        phoneNo: "",
      });
    }
  }, [isSubmitSuccessfull, reset]);

  const submitContactForm = async (data) => {
    dispatch(setProgress(40))
    const toastId = toast.loading("Loading...")
    try {
      setLoading(true);
      const response = await apiConnector("POST", contactusEndpoint.CONTACT_US_API, data);
      dispatch(setProgress(60))
      setLoading(false);
      toast.success("Submitted Successfully")
      reset();
    } catch (e) {
      setLoading(false);
      toast.error("Something went wrong")
    }
    dispatch(setProgress(100))
    toast.dismiss(toastId);
  };

  return (
    <form onSubmit={handleSubmit(submitContactForm)}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row justify-between gap-5">
          {/* firstName */}
          <div className="flex flex-col gap-3 w-full ">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              className="md:text-xl bg-richblack-800 py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
              name="firstName"
              id="firstName"
              placeholder="First Name"
              {...register("firstName", { required: true })}
            />
            {errors.firstName && <span className="text-xs text-pink-200">Please enter your first name</span>}
          </div>

          {/* last name */}
          <div className="flex flex-col gap-3 w-full">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              className="md:text-xl bg-richblack-800 py-3 px-4 rounded-lg shadow-sm shadow-richblack-300 focus:outline-none"
              name="lastName"
              id="lastName"
              placeholder="Last Name"
              {...register("lastName")}
            />
          </div>
        </div>

        {/* email*/}
        <div className="flex flex-col gap-3">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            className="md:text-xl bg-richblack-800 py-3 px-4 rounded-lg shadow-sm shadow-richblack-300 focus:outline-none"
            name="email"
            id="email"
            placeholder="Enter your Email"
            {...register("email", { required: true })}
          />
          {errors.email && <span className="text-xs text-pink-200">Please Enter you email Address</span>}
        </div>

        {/* phone */}
        <div className="flex w-full flex-col gap-3">
          <label htmlFor="phone">Phone Number</label>
          <div className="flex flex-row gap-5 w-full">
            <select
              id="countryCode"
              name="countryCode"
              defaultValue={"+91"}
              className="bg-richblack-800 text-richblack-300 shadow-sm shadow-richblack-300 w-[90px] py-3 rounded-lg px-4 focus:outline-none"
              {...register("countryCode", { required: true })}
            >
              {cuntryCodes.map((code, index) => (
                <option key={index} className="px-3" value={code.code}>
                  {code.code} {" - "} {code.country}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="phone"
              id="phone"
              placeholder="123 456 7890"
              className="md:text-xl w-full bg-richblack-800 py-3 px-4 shadow-sm shadow-richblack-300 rounded-lg focus:outline-none"
              {...register("phone", {
                required: true,
                maxLength: { value: 10, message: "Invalid Phone Number!" },
                minLength: { value: 8, message: "Invalid Phone Number" }
              })}
            />
            {
              errors.phone && (
                <span>{errors?.phone?.message}</span>
              )
            }
          </div>
        </div>

        {/* message */}
        <div className="flex flex-col gap-3">
          <label htmlFor="message">Message</label>
          <textarea
            name="message"
            className="md:text-xl bg-richblack-800 py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
            id="message"
            cols="30"
            rows="4"
            placeholder="Enter your message here"
            {...register("message", {
              required: true,
            })}
          >
            {errors.message && <span>Please Enter your message</span>}
          </textarea>
        </div>

        <ActionButton
          disabled={loading}
          active
          type="submit"
        >
          {
            loading ? "Loading..." : "Send message"
          }
        </ActionButton>
      </div>
    </form>
  );
};

export default ContactUsForm;
