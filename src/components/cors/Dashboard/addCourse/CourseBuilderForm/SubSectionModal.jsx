import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import ActionButton from "../../../../common/ActionButton";
import {
  createSubSection,
  updateSubSection,
} from "../../../../../services/operations/courseDetailsAPI";
import { setCourse } from "../../../../../slices/CourseSlice";
import { RxCross2 } from "react-icons/rx";
import Upload from "./Upload";
import toast from "react-hot-toast";

const SubSectionModal = ({
  modalData,
  setModalData,
  add = false,
  view = false,
  edit = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm();

  const dispatch = useDispatch();
  const [loading, setLoaing] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const { course } = useSelector((state) => state.course);

  useEffect(() => {
    if (view || edit) {
      setValue("lectureTitle", modalData.title);
      setValue("lectureDescription", modalData.description);
      setValue("lectureVideo", modalData.videoUrl);
      setValue("timeDuration", modalData.timeDuration);
    }
  }, []);

  const isFormUpdated = () => {
    const currentValues = getValues();

    if (
      currentValues.lectureTitle !== modalData.title ||
      currentValues.lectureDescription !== modalData.description ||
      currentValues.lectureVideo !== modalData.videoUrl ||
      currentValues.timeDuration !== modalData.timeDuration
    ) {
      return true;
    } else {
      return false;
    }
  };

  const submitHandler = async (data) => {
    if (view) {
      return;
    }

    if (edit) {
      if (!isFormUpdated()) {
        toast.error("No changes made to the form!");
      } else {
        handleEditSubSection();
      }
      return false;
    }

    const formData = new FormData();
    formData.append("sectionId", modalData);
    formData.append("title", data.lectureTitle);
    formData.append("description", data.lectureDescription);
    formData.append("timeDuration", data.timeDuration);
    formData.append("video", data.lectureVideo);

    setLoaing(true);

    // calling api
    const updatedSection = await createSubSection(formData, token);

    if (updatedSection) {
      // update course
      const updatedCourseContent = course?.courseContent?.map((section) =>
        section._id === modalData ? updatedSection : section
      );
      const updatedCourse = { ...course, courseContent: updatedCourseContent };
      dispatch(setCourse(updatedCourse));
    }

    setModalData(null);
    setLoaing(false);
  };

  const handleEditSubSection = async () => {
    const currentValues = getValues();

    const formData = new FormData();

    formData.append("sectionId", modalData.sectionId);
    formData.append("subSectionId", modalData._id);

    if (currentValues.lectureTitle !== modalData.title) {
      formData.append("title", currentValues.lectureTitle);
    }

    if (currentValues.lectureDescription !== modalData.description) {
      formData.append("description", currentValues.lectureDescription);
    }

    if (currentValues.timeDuration !== modalData.timeDuration) {
      formData.append("timeDuration", currentValues.timeDuration);
    }

    if (currentValues.lectureVideo !== modalData.videoUrl) {
      formData.append("video", currentValues.lectureVideo);
    }

    setLoaing(true);

    // api call
    const result = await updateSubSection(formData, token);

    if (result) {
      // update course
      const updatedCourseContent = course?.courseContent?.map(section => {
        return section._id === modalData.sectionId ? result : section
      }
      )
      const updatedCourse = { ...course, courseContent: updatedCourseContent };
      dispatch(setCourse(updatedCourse));
    }

    setModalData(null);
    setLoaing(false);
  };

  return (
    <div className="fixed z-[12] top-0 left-0 right-0 bottom-0 text-richblack-5 flex flex-col justify-center items-center bg-[#0000008b] w-full">
      <div className="bg-richblack-900 overflow-auto my-5 border border-richblack-600 px-5 pb-5 rounded-lg w-10/12 xl:w-6/12 flex flex-col gap-5 ">

        {/* form Heading */}
        <div className="flex justify-between py-5 border-b border-richblack-600">
          <p>
            {view && "View Lecture"} {add && "Create New Lecture"}{" "}
            {edit && "Edit Lecture"}
          </p>
          <button onClick={() => (!loading ? setModalData(null) : null)}>
            <RxCross2 />
          </button>
        </div>

        {/* Form */}
        <div>
          <form className="flex flex-col justify-between gap-5" onSubmit={handleSubmit(submitHandler)}>
            <Upload
              name="lectureVideo"
              label="Lecture Video"
              register={register}
              setValue={setValue}
              errors={errors}
              video={true}
              viewData={view ? modalData.videoUrl : null}
              editData={edit ? modalData.videoUrl : null}
            />

            <div className="flex flex-col gap-2">
              <label htmlFor="lectureTitle" className="text-lg">Lecture Title</label>
              <input
                placeholder="Lecture Title"
                type="text"
                name="lectureTitle"
                id="lectureTitle"
                className="text-xl bg-richblack-800 w-full py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
                {...register("lectureTitle", { required: true })}
              />
              {errors.lectureTitle && <span className="text-xs text-pink-200">Lecture Title is required</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="timeDuration" className="text-lg">Lecture Duration</label>
              <input
                placeholder="Lecture Duration"
                type="text"
                name="timeDuration"
                id="timeDuration"
                className="text-xl bg-richblack-800 w-full py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
                {...register("timeDuration", { required: true })}
              />
              {errors.timeDuration && <span className="text-xs text-pink-200">Lecture Duration is required</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="lectureDescription" className="text-lg">Description</label>
              <textarea
                type="text"
                name="lectureDescription"
                id="lectureDescription"
                rows={3}
                className="text-xl bg-richblack-800 w-full py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300"
                placeholder="Enter Lecture Description"
                {...register("lectureDescription", { required: true })}
              ></textarea>
              {errors.lectureDescription && (
                <span className="text-xs text-pink-200">Lecture Description is required</span>
              )}

            </div>
            {!view && (
              <div>
                <ActionButton active >{edit ? "Save Changes" : "Save"}</ActionButton>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubSectionModal;
