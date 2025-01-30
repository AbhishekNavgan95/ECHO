import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEdit } from "react-icons/fa";
import { FaFileContract } from "react-icons/fa";
import { MdAutoDelete } from "react-icons/md";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import {
  updatePfp,
  updateProfile,
  deleteAccount,
  updatePassword,
} from "../../../services/operations/profileAPI";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../../slices/profileSlice";
import Modal from "../../common/Modal"
import ActionButton from '../../common/ActionButton'
import ActionLabel from "../../common/ActionLabel";
import DangerButton from "../../common/DangerButton";

const Settings = () => {
  const { token } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.profile.user);
  const image = useSelector((state) => state.profile.user.image);
  const [modalData, setModalData] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(image);
  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    about: "",
    gender: "",
    contactNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // pending
  const imageUpload = async (e) => {
    e.preventDefault();
    const file = e.target[0].files[0];
    const result = await updatePfp(token, file, dispatch);
    dispatch(setUser({ ...user, image: result }));
  };

  const updateImage = (e) => {
    const file = e.target.files[0];
    setFile(URL.createObjectURL(file));
  };

  const updateDetails = (e) => {
    const { name, value, checked, type, id } = event.target;
    // console.log(name, value, checked, type, id);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "radio" ? id : value,
    }));
  };

  const detailsSubmitHandler = (e) => {
    e.preventDefault();
    updateProfile(token, formData, dispatch);
    setFormData({
      dateOfBirth: "",
      about: "",
      gender: "",
      contactNumber: "",
    });
  };

  const handlePasswordChange = (e) => {
    setPassword((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const changePassword = (e) => {
    e.preventDefault();
    // console.log(password);
    updatePassword(token, password, dispatch);
    setPassword({
      oldPassword: "",
      newPassword: "",
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col px-5 w-full gap-10 justify-center mx-auto py-10 xl:py-20">
        <h2 className="text-3xl xl:text-4xl font bold">Update Profile</h2>

        {/* Update Profile Picture */}
        <form onSubmit={imageUpload}>
          <section className="flex justify-between items-center bg-richblack-800 p-5 lg:p-10 border border-richblack-600 rounded-lg">
            <div className="flex flex-col lg:flex-row gap-5 items-center justify-between w-full">
              <div className="flex flex-col lg:flex-row items-center gap-5">
                <img
                  loading="lazy"
                  src={file}
                  alt="image"
                  className=" border-2 border-richblack-100 w-[100px] aspect-square rounded-full object-cover"
                />
                <h5 className="md:text-xl font-semibold">
                  {user.firstName + " " + user.lastName}
                </h5>
              </div>
              <div className="flex flex-col gap-3 items-end">
                <div className="flex gap-3">
                  <ActionLabel
                    use="thumbnail"
                    active={false}
                    className="text-center flex items-center px-4 py-2 rounded-md md:text-lg bg-richblack-600 hover:bg-richblack-700 focus:hover:bg-richblack-700 text-richblack-25 active:scale-95 focus:scale-95 transition-all duration-200 shadow-sm shadow-richblack-300 gap-3"
                  >
                    <span className="flex items-center gap-3">
                      <FaFileContract />
                      Select File
                    </span>
                  </ActionLabel>
                  <input
                    onChange={updateImage}
                    type="file"
                    required
                    name="thumbnail"
                    accept="image/*"
                    id="thumbnail"
                    className="hidden w-[0x]"
                  />
                  <div className="flex gap-5"></div>
                  <ActionButton
                    active="true"
                    type="submit">
                    <span className="flex items-center gap-3">
                      <FaEdit />
                      Save
                    </span>
                  </ActionButton>
                </div>
                <p className="text-richblack-300 md:text-lg">
                  Do not forget to save the changes
                </p>
              </div>
            </div>
          </section>
        </form>

        {/* Update Profile Account Details*/}
        <form onSubmit={detailsSubmitHandler}>
          <section className="flex flex-col justify-between items-start bg-richblack-800 p-5 lg:p-10 border border-richblack-600 rounded-lg gap-y-5">
            <div className="flex items-center justify-between w-full">
              <h4 className="text-xl md:text-2xl font-semibold">Personal Details</h4>
            </div>
            <div className="grid xl:grid-cols-2 w-full gap-x-10 gap-y-5">
              <div className="flex flex-col w-full gap-3">
                <label htmlFor="dateOfBirth">Date Of Birth</label>
                <input
                  type="date"
                  required
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={updateDetails}
                  className="py-2 px-4 w-full rounded-lg shadow-sm focus:outline-none shadow-richblack-300 md:text-lg text-richblack-100 bg-richblack-700"
                  placeholder="dd/mm/yy"
                  id="dateOfBirth"
                />
              </div>
              <div className="flex flex-col w-full gap-3">
                <label htmlFor="gender">Gender</label>

                <select
                  name="gender"
                  className="py-2 px-4 md:text-lg  w-full rounded-lg focus:outline-none shadow-sm shadow-richblack-300  text-richblack-100 bg-richblack-700"
                  id="gender"

                  value={formData.gender}
                  onChange={updateDetails}
                >
                  <option disabled value="" >--Select Gender--</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">other</option>
                  <option value={undefined}>prefer not to say</option>
                  <option value="Attack Helicopter">Attack Helicopter</option>
                </select>
              </div>
              <div className="flex flex-col w-full gap-3">
                <label htmlFor="dateOfBirth">Contact Number</label>
                <input
                  type="number"
                  required
                  value={formData.contactNumber}
                  onChange={updateDetails}
                  name="contactNumber"
                  className="py-2 px-4 md:text-lg  w-full rounded-lg focus:outline-none shadow-sm shadow-richblack-300  text-richblack-100 bg-richblack-700"
                  placeholder="123 - 456 - 7890"
                  id="contactNumber"
                />
              </div>
              <div className="flex flex-col w-full gap-3">
                <label htmlFor="dateOfBirth">Description</label>
                <textarea
                  rows={1}
                  value={formData.about}
                  onChange={updateDetails}
                  name="about"
                  className="py-2 md:text-lg px-4 w-full rounded-lg focus:outline-none shadow-sm resize-none shadow-richblack-300 text-richblack-100 bg-richblack-700"
                  placeholder="Tell us something about yourself"
                  id="about"
                ></textarea>
              </div>
            </div>
            <ActionButton
              type="submit"
              active="true"
            >
              <span className="flex gap-3 items-center">
                <FaEdit />
                Save
              </span>
            </ActionButton>
          </section>
        </form>

        {/* Change Password */}
        <form onSubmit={changePassword}>
          <section className="flex flex-col justify-between items-start bg-richblack-800 p-5 lg:p-10 gap-5 rounded-lg border border-richblack-600">
            <div className="flex items-center justify-between w-full">
              <h4 className="text-xl md:text-2xl font-semibold">Change Password</h4>
            </div>
            <div className="grid xl:grid-cols-2 w-full gap-x-10 gap-y-5">
              <div className="flex flex-col w-full gap-3">
                <label htmlFor="oldPassword">Old Password</label>
                <div className="flex rounded-lg shadow-sm focus:outline-none shadow-richblack-300 md:text-lg text-richblack-100 bg-richblack-700">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete=""
                    name="oldPassword"
                    value={password.oldPassword}
                    onChange={handlePasswordChange}
                    className="py-2 px-4 w-full rounded-l=lg m focus:outline-none shadow-richblack-300 md:text-lg text-richblack-100 bg-richblack-700"
                    placeholder="Old Password"
                    id="oldPassword"
                  />
                  <span className="w-[50px] flex items-center justify-center" onClick={() => setShowPassword(!showPassword)}>{
                    !showPassword ? <FaRegEye /> : <FaRegEyeSlash />
                  }</span>
                </div>
              </div>
              <div className="flex flex-col w-full gap-3">
                <label htmlFor="oldPassword">New Password</label>
                <div className="flex rounded-lg shadow-sm focus:outline-none shadow-richblack-300 md:text-lg text-richblack-100 bg-richblack-700">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete=""
                    name="newPassword"
                    value={password.newPassword}
                    onChange={handlePasswordChange}
                    className="py-2 px-4 w-full rounded-l=lg m focus:outline-none shadow-richblack-300 md:text-lg text-richblack-100 bg-richblack-700"
                    placeholder="New Password"
                    id="newPassword"
                  />
                  <span className="w-[50px] flex items-center justify-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{
                    !showConfirmPassword ? <FaRegEye /> : <FaRegEyeSlash />
                  }</span>
                </div>
              </div>
            </div>
            <ActionButton
              type="submit"
              active="true"
            >
              <span className="flex gap-3 items-center">
                <FaEdit />
                Save
              </span>
            </ActionButton>
          </section>
        </form>

        {/* Delete Acount */}
        <section className="flex flex-col justify-between items-start bg-richblack-800 p-5 lg:p-10 border border-richblack-600 rounded-lg">
          <div className="flex w-full items-start py-2 gap-5">
            <div className="flex flex-col  items-start gap-3">
              <h3 className="text-xl md:text-2xl font-semibold">Delete Account</h3>
              <div className="text-richblack-300">
                <p>Would you like to delete your Account?</p>
                <p>
                  This Account may contain Paid Courses, Deleting this account
                  will permanenetly Delete all the purchased courses and Account
                  details
                </p>
              </div>
              <DangerButton
                action={() => setModalData({
                  heading: "Delete this account?",
                  subHeading: "All the purchased courses will be deleted",
                  btn1Handler: () => deleteAccount(token, dispatch, navigate),
                  btn1Text: "Delete",
                  btn2Handler: () => setModalData(null),
                  btn2Text: "Cancel"
                })}
              >
                <MdAutoDelete />
                Delete Account
              </DangerButton>
            </div>
          </div>
        </section>
      </div>
      {
        modalData && <Modal modalData={modalData} />
      }
    </div>
  );
};

export default Settings;
