import React from "react";
import { FaTimes } from "react-icons/fa";
import { useState } from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { IoIosAdd } from "react-icons/io";

const TagInput = ({ name, label, register, errors, setValue, placeholder }) => {
  const [tagList, setTagList] = useState([]);
  const [tag, setTag] = useState("");
  const { editCourse, course } = useSelector((state) => state.course);

  useEffect(() => {
    register(name, {
      required: true,
      // validate: (value) => value.length > 0
    });
    if (editCourse) {
      setTagList(course?.tag?.split(","));
      setValue(name, course?.tag);
    }
  }, []);

  const handleUpdateTag = () => {
    if (tag) {
      setTagList(
        (prev) => [...prev, tag]
      );
      setValue(name, [...tagList, tag]);
      setTag("");
    } else {
      return
    }
  }

  return (
    <div>
      <label htmlFor={name}>
        {`${label} `}
        <sup>*</sup>
      </label>
      <div className="flex flex-wrap gap-2 my-2">
        {tagList.map((tag, index) => (
          <div
            key={index}
            className="my-1 px-4 flex items-center rounded-full bg-richblack-5 py-1 text-lg text-richblack-900"
          >
            <span className="text-richblack-900">{tag}</span>
            <button
              type="button"
              onClick={() => {
                const updatedTags = [...tagList];
                updatedTags.splice(index, 1);
                setTagList(updatedTags);
                setValue(name, updatedTags);
              }}
              className="ml-2 text-richblack-900"
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>
      <div className="text-xl overflow-hidden bg-richblack-800 w-full flex items-center rounded-lg focus:outline-none shadow-sm shadow-richblack-300">
        <input
          type="text"
          id={name}
          value={tag}
          className="py-3 px-4 bg-richblack-800 w-full outline-none"
          placeholder={placeholder}
          onChange={(e) => {
            setTag(e.target.value)
          }}
        />
        <div
          className="px-3 text-2xl bg-richblack-800 cursor-pointer"
          onClick={handleUpdateTag}
        ><IoIosAdd /></div>
      </div>
      {errors[name] && (
        <span className="text-xs text-pink-200">Tags are required</span>
      )}
    </div>
  );
};

export default TagInput;