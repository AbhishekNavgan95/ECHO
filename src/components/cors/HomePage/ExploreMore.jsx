import React, { useState } from "react";
import { HomePageExplore } from "../../../data/homepage-explore";
import HighlightText from "../../common/HighlightText";
import CourseCard from "./CourseCard";

const ExploreMore = () => {
  const tabs = [
    "Free",
    "New to coding",
    "Most popular",
    "Skills paths",
    "Career paths",
  ];

  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const [courses, setCourses] = useState(HomePageExplore[0].courses);
  const [currentCard, setCurrentCard] = useState(
    HomePageExplore[0].courses[0].heading
  );

  const setMyCards = (value) => {
    setCurrentTab(value);
    const result = HomePageExplore.filter((course) => course.tag === value);
    setCourses(result[0].courses);
    setCurrentCard(result[0].courses[0].heading);
  };

  return (
    <div className="flex items-center flex-col relative">
      <div className="text-3xl xl:text-4xl font-bold text-richblack-5 text-center">
        Unlock the <HighlightText text={"Power of Code"} />
      </div>

      <p className="text-xl my-5 text-richblack-300 font-semibold text-center">
        Learn to build anything u can imagin
      </p>

      <div className="lg:mb-44 flex flex-col lg:flex-row justify-center gap-2 w-full lg:w-max bg-richblack-700 py-2 items-center mb-5 text-richblack-5 rounded-3xl lg:rounded-full px-2 shadow-sm shadow-richblack-300">
        {tabs.map((tab, index) => {
          return (
            <button
              key={index}
              className={
                currentTab === tab
                  ? "bg-richblack-900 text-lg flex flex-row justify-center item-center gap-2 py-2 px-6 rounded-full w-full lg:w-auto shadow-sm shadow-richblack-300 transition-all duration-300"
                  : "bg-richblack-700 text-lg flex flex-row justify-center item-center gap-2 py-2 px-6 rounded-full text-richblack-100 w-full lg:w-auto transition-all duration-300"
              }
              onClick={() => setMyCards(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* course cards */}
      <div className="flex flex-col lg:flex-row my-5 lg:my-0 gap-8 lg:absolute bottom-0 lg:translate-y-[50%] max-w-maxContent">
        {courses.map((course, index) => (
          <CourseCard
            key={index}
            course={course}
            currentCard={currentCard}
            setCurrentCard={setCurrentCard}
          />
        ))}
      </div>
    </div>
  );
};

export default ExploreMore;
