import React, { useState } from "react";
import { set, useForm } from "react-hook-form";
import { CiCirclePlus } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import NestedView from "./NestedView";
import { MdNavigateNext, MdNavigateBefore } from "react-icons/md";
import ActionButton from "../../../../common/ActionButton";
import {
  setCourse,
  setEditCourse,
  setStep,
} from "../../../../../slices/CourseSlice";
import {
  createSection,
  updateSection,
} from "../../../../../services/operations/courseDetailsAPI";
import toast from "react-hot-toast";

const CourseBuilderForm = () => {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();
  const [editSectionName, setEditSectionName] = useState(null);
  const { course } = useSelector((state) => state.course);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const submitHandler = async (data) => {
    setLoading(true);
    let result;

    if (editSectionName) {
      // editing the section
      result = await updateSection(
        {
          sectionName: data.sectionName,
          sectionId: editSectionName,
          courseId: course._id,
        },
        token
      );
    } else {
      result = await createSection(
        {
          sectionName: data.sectionName,
          courseId: course?._id,
        },
        token
      );
    }

    // update values
    if (result) {
      dispatch(setCourse(result));
      setEditCourse(null);
      setValue("sectionName", "");
      setEditSectionName(false);
    }

    // set loading false
    setLoading(false);
  };

  const cancelEdit = () => {
    setEditSectionName(false);
    setValue("sectionName", "");
  };

  const goBack = () => {
    dispatch(setStep(1));
    dispatch(setEditCourse(true));
  };

  const goNext = () => {
    if (course?.courseContent?.length === 0) {
      toast.error("Please add atleast one Section");
      return;
    }

    if (
      course?.courseContent?.some((section) => section?.subSection?.length === 0)
    ) {
      toast.error("Please add atleast one Lecture in each Section");
      return;
    }

    dispatch(setStep(3));
  };

  const handleChangeEditSectionName = (sectionId, sectionName) => {
    if(editSectionName === sectionId) {
      cancelEdit();
      return;
    }

    setEditSectionName(sectionId);
    setValue("sectionName", sectionName);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <form onSubmit={handleSubmit(submitHandler)}>
        <div className="flex flex-col justify-between  gap-5 w-full">
          <div className="flex flex-col gap-3 w-full ">
            <label htmlFor="sectionName">
              Section Name <sup>*</sup>
            </label>
            <input
              type="text"
              name="sectionName"
              id="sectionName"
              className="text-xl bg-richblack-800 w-full py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
              placeholder="Add Section Name"
              {...register("sectionName", { required: true })}
            />
            {errors.sectionName && <span className="text-xs text-pink-200">Section Name is required</span>}
          </div>
          <div className="flex gap-3">
            <ActionButton
              type="submit"
              active
            >
              {editSectionName ? "Edit Section Name" : "Create Section"}
              <CiCirclePlus />
            </ActionButton>
            {editSectionName && (
              <ActionButton
                onClick={cancelEdit}
                className="text-center flex items-center px-4 py-2 rounded-md text-lg bg-richblack-600 hover:bg-richblack-700 focus:hover:bg-richblack-700 text-richblack-5 active:scale-95 focus:scale-95 transition-all duration-200 shadow-sm shadow-richblack-300 gap-3"
              >
                Cancel
              </ActionButton>
            )}
          </div>
        </div>
      </form>
      {course?.courseContent.length > 0 && <NestedView handleChangeEditSectionName={handleChangeEditSectionName} />}
      <div className="flex justify-end gap-3">
        <ActionButton
          onClick={goBack}
        >
          <MdNavigateBefore />
          Back
        </ActionButton>
        <ActionButton
        active
          onClick={goNext}
        >
          Next
          <MdNavigateNext />
        </ActionButton>
      </div>
    </div>
  );
};

export default CourseBuilderForm;
