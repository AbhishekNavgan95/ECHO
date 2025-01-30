import React, { useDebugValue, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { getUserCourses } from "../services/operations/profileAPI";
import { SyncLoader } from "react-spinners";
import { useNavigate } from "react-router-dom"
import ProgressBar from "@ramonak/react-progress-bar";
import EnrolledCourseSkeleton from "../../Skeletons/EnrolledCourseSkeleton";
import { getUserCourses } from "../../../services/operations/profileAPI";

const EnrolledCourses = () => {
  const token = useSelector((state) => state.auth.token);
  const [enrolledCourses, setEnrolledCourses] = useState();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getEnrolledCourses = async () => {
    try {
      const response = await getUserCourses(token, dispatch);
      setEnrolledCourses(response);
    } catch (e) {
      console.log("unable to fetch enrolled courses", e);
    }
  };

  const countTotalLectures = (course) => {
    let count = 0;
    course?.courseContent?.forEach((section) => section?.subSection.forEach(lecture => count++))
    return count;
  }

  useEffect(() => {
    getEnrolledCourses();
  }, []);

  return (
    <div>
      <section className="flex flex-col w-full px-5 gap-10 justify-center mx-auto py-10  xl:py-20">
        <h2 className="text-3xl xl:text-4xl">My Courses</h2>
        <div className="flex w-full flex-col xl:flex-row gap-5 justify-between items-center bg-richblack-900 ">
          {!enrolledCourses ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 w-full 50 gap-5 ">
              <EnrolledCourseSkeleton count={6} />
            </div>
          ) : enrolledCourses?.courses?.length <= 0
            ? <p className="text-2xl py-5 oflex items-center text-center w-full text-richblack-25">Your have not enrolled in any course yet</p>
            : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 w-full justify-between 50 gap-5 ">
                {enrolledCourses?.courses?.map((course, index) => (
                  <div key={index}
                    onClick={() => navigate(`/view-course/${course?._id}/section/${course?.courseContent?.[0]?._id}/sub-section/${course?.courseContent?.[0]?.subSection?.[0]?._id}`)}
                    className="flex cursor-pointer border-richblack-600 transition-all duration-300 justify-between flex-col items-start gap-1 p-3 border group bg-richblack-800 rounded-lg shadow-xs shadow-richblack-300">
                    <div className="flex flex-col gap-3 items-start w-full">
                      <div className="overflow-hidden">
                        <img src={course.thumbnail} className="min-w-full aspect-video object-cover rounded-sm group-hover:scale-105 transition-scale duration-300" loading="lazy" alt="thumbnail" />
                      </div>
                      <div className="flex flex-col justify-center gap-1">
                        <h3 className="text-xl line-clamp-2">{course.courseTitle}</h3>
                        <p className="text-richblack-300 line-clamp-1">{course.courseDescription}</p>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 ">
                      <p className="text-nowrap ">progress : {Math.floor((enrolledCourses.courseProgress.find((progress) => progress?.courseId === course._id)?.completedVideos.length / countTotalLectures(course)) * 100)}%</p>
                      <span className="md:block self-stretch">
                        <ProgressBar
                          bgColor={"#E7C009"}
                          completed={Math.floor((enrolledCourses.courseProgress.find((progress) => progress?.courseId === course._id)?.completedVideos.length / countTotalLectures(course)) * 100)}
                          height="8px"
                          isLabelVisible={false}
                        />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default EnrolledCourses;
