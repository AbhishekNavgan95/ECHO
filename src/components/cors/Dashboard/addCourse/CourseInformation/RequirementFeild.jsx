import React, { useEffect, useState } from "react";
import { IoIosAdd } from "react-icons/io";

const RequirementFeild = ({
  name,
  label,
  register,
  errors,
  setValue,
  getValues,
  placeholder,
}) => {
  const [requirement, setRequirement] = useState("");
  const [requirementList, setRequirementList] = useState([]);

  useEffect(() => {
    register(name, {
      required: true,
      validate: (value) => value.length > 0,
    });
  }, []);

  useEffect(() => {
    setValue(name, requirementList);
  }, [requirementList]);

  const handleAddRequirement = () => {
    if (requirement) {
      setRequirementList([...requirementList, requirement]);
      setRequirement("");
    }
  };

  const handleRemoveRequirement = (index) => {
    const updatedRequirementList = [...requirementList];
    updatedRequirementList.splice(index, 1);
    setRequirementList(updatedRequirementList);
  };

  return (
    <>
      <label className="richblack-25" htmlFor={name}>
        {label} <sup>*</sup>
      </label>
      <div className="text-xl bg-richblack-800 w-full  rounded-lg focus:outline-none shadow-sm shadow-richblack-300 flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          className="text-xl bg-richblack-800 px-4 w-full py-3 rounded-lg focus:outline-none"
          id={name}
          name={name}
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
        <button type="button" className="px-3 text-2xl" onClick={handleAddRequirement}>
          <IoIosAdd />
        </button>
      </div>
      {requirementList.length > 0 && (
        <ul className="flex flex-col">
          <div className="rounded-lg overflow-hidden  shadow-sm shadow-richblack-300">
            {requirementList.map((item, index) => (
              <li
                key={index}
                className="flex justify-between text-richblack-100  bg-richblack-800 py-3 text-xl px-4"
              >
                <span>{item}</span>
                <button
                  type="button"
                  className="hover:text-richblack-5 rotate-[45deg] transition-all duration-200 "
                  onClick={() => handleRemoveRequirement(index)}
                >
                  <IoIosAdd />
                </button>
              </li>
            ))}
          </div>
        </ul>
      )}
      {errors[name] && <span className="text-xs text-pink-200">{label} is required</span>}
    </>
  );
};

export default RequirementFeild;
