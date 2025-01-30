import React, { useEffect, useState } from "react";
import { set, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import ActionButton from "../../../../common/ActionButton"
import {
  addCourseDetails,
  editCourseDetails,
  fetchCourseCategories,
} from "../../../../../services/operations/courseDetailsAPI";
import { MdCurrencyRupee } from "react-icons/md";
import TagInput from "./TagInput";
import Upload from "./Upload";
import RequirementFeild from "./RequirementFeild";
import {
  setCourse,
  setEditCourse,
  setStep,
} from "../../../../../slices/CourseSlice";
import toast from "react-hot-toast";
import { COURSE_STATUS } from "../../.././../../utils/constants";

const CourseInformationForm = () => {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { step, course, editCourse } = useSelector((state) => state.course);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // console.log("Course : ", course);
    // console.log("set edit course : ", editCourse);

    const getCategories = async () => {
      setLoading(true);
      const categories = await fetchCourseCategories();
      if (categories.length > 0) {
        setCategories(categories);
      }
      setLoading(false);
    };

    if (editCourse) {
      setValue("courseName", course.courseTitle);
      setValue("courseDescription", course.courseDescription);
      setValue("coursePrice", course.price);
      setValue("tag", course.tag.toString());
      setValue("courseBenifits", course.whatYouWillLearn);
      setValue("category", course.category);
      setValue("courseRequirements", course.instructions);
      setValue("courseImage", course.thumbnail);
    }

    getCategories();
  }, []);

  const isFormUpdated = () => {
    const currentValues = getValues();
    // console.log("current values : ", currentValues);

    if (
      currentValues.courseName !== course.courseTitle ||
      currentValues.courseDescription !== course.courseDescription ||
      currentValues.tag.toString() !== course.tag.toString() ||
      currentValues.coursePrice !== course.price ||
      currentValues.courseBenifits !== course.whatYouWillLearn ||
      currentValues.category !== course.category ||
      currentValues.courseImage !== course.thumbnail
    ) {
      // console.log("no changes has been done to the course");
      return true;
    } else {
      // console.log("changes has been done to the course");
      return false;
    }
  };

  const submitHandler = async (data) => {
    // console.log("data: ", data);
    if (editCourse) {
      if (isFormUpdated()) {
        const currentValues = getValues();
        const formData = new FormData();

        // course id
        formData.append("courseId", course._id);

        // course name
        if (currentValues.courseTitle !== course.courseTitle) {
          formData.append("courseName", data.courseName);
        } else {
          formData.append("courseName", course?.courseTitle);
        }

        // course description
        if (currentValues.courseDescription !== course.courseDescription) {
          formData.append("courseDescription", data.courseDescription);
        } else {
          formData.append("courseDescription", course?.courseDescription);
        }

        // course prince
        if (currentValues.coursePrice !== course?.price) {
          formData.append("price", data.coursePrice);
        } else {
          formData.append("price", course?.price);
        }

        // course what you will learn
        if (currentValues.courseBenifits !== course?.whatYouWillLearn) {
          formData.append("whatYouWillLearn", data.courseBenifits);
        } else {
          formData.append("whatYouWillLearn", course?.whatYouWillLearn);
        }

        // course category
        if (currentValues.category !== course.category) {
          formData.append("category", data.category);
        } else {
          formData.append("category", course.category);
        }

        // course tags
        if (currentValues.tag.toString() !== course.tag.toString()) {
          console.log("data.tag : ", tag);
          formData.append("tag", data?.tag);
        } else {
          formData.append("tag", course?.tag);
        }

        // course requirements
        if (
          currentValues.courseRequirements.toString() !==
          course.instructions.toString()
        ) {
          // data.courseRequirements.forEach(requirement => formData.append("instructions", requirement));
          formData.append("instructions", data.courseRequirements);
        } else {
          formData.append("instructions", course.instructions);
        }

        // if image exists
        if(data.courseImage) {
          formData.append("thumbnail", data.courseImage)
        }

        setLoading(true);
        const result = await editCourseDetails(formData, token);
        console.log("edit course detail result : ", result);
        if (result) {
          dispatch(setStep(2));
          setEditCourse(false);
          dispatch(setCourse(result));
        }
      } else {
        toast.error("No changes has been done to the Form!");
      }
      setLoading(false);
      return;
    }
    // console.log("data : ", data);

    // create a new course
    const formData = new FormData();
    formData.append("courseName", data.courseName);
    formData.append("courseDescription", data.courseDescription);
    formData.append("thumbnail", data.courseImage);
    formData.append("price", data.coursePrice);
    formData.append("category", data.category);
    formData.append("whatYouWillLearn", data.courseBenifits);
    formData.append("instructions", data.courseRequirements);
    formData.append("tag", data.tag);
    formData.append("status", COURSE_STATUS.DRAFT);

    setLoading(true);

    const result = await addCourseDetails(formData, token);

    if (result) {
      dispatch(setStep(2));
      // console.log("created course details : ", result);

      dispatch(setCourse(result));
      // console.log("course : ", course);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <form onSubmit={handleSubmit(submitHandler)}>
        <div className="flex flex-col justify-between gap-5 w-full">
          {/* // course Title */}
          <div className="flex flex-col gap-3 w-full ">
            <label htmlFor="courseName">
              Course Title <sup>*</sup>
            </label>
            <input
              type="text"
              name="courseName"
              id="courseName"
              className="text-xl bg-richblack-800 w-full py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
              placeholder="Course Title"
              {...register("courseName", { required: true })}
            />
            {errors.courseName && <span className="text-xs text-pink-200">Course Title is Required</span>}
          </div>

          {/* // course description */}
          <div className="flex flex-col gap-3 w-full ">
            <label htmlFor="courseDescription">
              Course Description <sup>*</sup>
            </label>
            <textarea
              name="courseDescription"
              id="courseDescription"
              cols="30"
              placeholder="Course Description"
              {...register("courseDescription", { required: true })}
              rows="5"
              className="text-xl bg-richblack-800 py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
            ></textarea>
            {errors.courseDescription && (
              <span className="text-xs text-pink-200">Course Description is Required</span>
            )}
          </div>

          {/* // course Price */}
          <div className="flex flex-col gap-3 w-full ">
            <label htmlFor="coursePrice">
              Course Price <sup>*</sup>
            </label>
            <div className="text-xl bg-richblack-800 w-full py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300 flex items-center">
              <span className="pr-3">
                <MdCurrencyRupee />
              </span>
              <input
                type="number"
                name="coursePrice"
                id="coursePrice"
                className="text-xl bg-richblack-800 w-full rounded-lg focus:outline-none"
                placeholder="Course Price"
                {...register("coursePrice", {
                  required: true,
                  valueAsNumber: true,
                })}
              />
            </div>
            {errors.coursePrice && <span className="text-xs text-pink-200">Course Price is Required</span>}
          </div>

          {/* // course Category */}
          <div className="flex flex-col gap-3 w-full ">
            <label htmlFor="category">
              Course Caregory <sup>*</sup>
            </label>
            <select
              name="category"
              className="text-xl bg-richblack-800 text-richblack-300 py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
              defaultValue={""}
              {...register("category", { required: true })}
              id="category"
            >
              <option value="" disabled>
                Choose a Category
              </option>
              {!loading &&
                categories.map((category, index) => (
                  <option key={index} value={category?._id}>
                    {category?.name}
                  </option>
                ))}
            </select>
            {errors.category && <span className="text-xs text-pink-200">Course Category is required</span>}
          </div>

          {/* // course Tags */}
          <div className="flex flex-col gap-3 w-full ">
            <TagInput
              label="Tags"
              name="tag"
              placeholder="Tags related to this course"
              register={register}
              errors={errors}
              setValue={setValue}
              getValues={getValues}
            />
          </div>

          {/* // course Image */}
          <div className="flex flex-col gap-3 w-full">
            <Upload
              name="courseImage"
              label="Course Poster"
              register={register}
              errors={errors}
              setValue={setValue}
            />
          </div>

          {/* // course Benifits */}
          <div className="flex flex-col gap-3 w-full ">
            <label htmlFor="courseBenifits">
              Benifits of Course <sup>*</sup>
            </label>
            <textarea
              name="courseBenifits"
              id="courseBenifits"
              cols="30"
              placeholder="Course Benifits"
              {...register("courseBenifits", { required: true })}
              rows="5"
              className="text-xl bg-richblack-800 py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
            ></textarea>
            {errors.courseBenifits && (
              <span className="text-xs text-pink-200">Course courseBenifits are Required</span>
            )}
          </div>

          {/* // course Requirements */}
          <div className="flex flex-col gap-3 w-full">
            <RequirementFeild
              name="courseRequirements"
              label="Requirements / Instructions"
              register={register}
              errors={errors}
              setValue={setValue}
              getValues={getValues}
              placeholder="Requirements"
            />
          </div>

          <div className="flex gap-3">
            <ActionButton
              type="submit"
              active
           >
              {!editCourse ? "Next" : "Save Changes"}
            </ActionButton>
            {editCourse && (
              <ActionButton
                onClick={() => dispatch(setStep(2))}
              >
                Next
              </ActionButton>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CourseInformationForm;
