import React from "react";
import { useSelector } from "react-redux";
import CourseInformationForm from "./CourseInformation/CourseInformationForm";
import CourseBuilderForm from "./CourseBuilderForm/CourseBuilderForm";
import PublishCourse from "./PublishCourse/PublishCourse";

const RenderSteps = () => {
  const step = useSelector((state) => state.course.step);

  const steps = [
    {
      id: 1,
      title: "Course Information",
    },
    {
      id: 2,
      title: "Course Builder",
    },
    {
      id: 3,
      title: "Publish Course",
    },
  ];

  return (
    <>
      <section className="flex flex-col gap-5 justify-between items-start w-full border border-richblack-600 px-5 lg:px-10 py-5 lg:py-10 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-5 w-full xl:flex-row items-center justify-between bg-richblack-900 px-4 py-3 rounded-full">
          <div className="flex gap-5">
            {steps.map((item, index) => (
              <div
                key={index}
                className={
                  item.id === step
                    ? "bg-yellow-100 text-yellow-900 rounded-full shadow-sm shadow-richblack-500 flex flex-col items-center justify-between px-4 py-1 relative group hover:cursor-pointer"
                    : "bg-yellow-900 border border-yellow-100 text-yellow-100 rounded-full shadow-sm shadow-richblack-500 flex flex-col justify-between items-center px-4 py-1 relative group hover:cursor-pointer"
                }
              >
                <p className="text-2xl font-bold">
                  {item.id}{" "}
                  <span className="absolute z-[2] scale-y-0 group-hover:scale-y-100 transition-all duration-200 origin-top left-[50%] translate-x-[-50%] top-[90%] my-5 font-normal text-yellow-100 text-center bg-yellow-900 px-5 py-2 rounded-lg text-sm">
                    {item.title}
                  </span>
                </p>
              </div>
            ))}
          </div>
          <h4 className="text-xl px-4 font-semibold text-center">
            {steps.map((item, index) => (item.id === step ? item.title : null))}
          </h4>
        </div>
        <div className="w-full">
          <div >
            {step === 1 && <CourseInformationForm />}
          </div>
          <div>{step === 2 && <CourseBuilderForm />}</div>
          <div>{step === 3 && <PublishCourse />}</div>
        </div>
      </section>
    </>
  );
};

export default RenderSteps;
