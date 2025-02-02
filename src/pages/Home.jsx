import banner from "../assets/Images/banner.mp4";
import CodeBlock from "../components/cors/HomePage/CodeBlock";
import CtaButton from "../components/common/CtaButton";
import ExploreMore from "../components/cors/HomePage/ExploreMore";
import HighlightText from "../components/common/HighlightText";
import InstructorSection from "../components/cors/HomePage/InstructorSection";
import LearningLanguageSection from "../components/cors/HomePage/LearningLanguageSection";
import { Link, useNavigate } from "react-router-dom";
import { MdArrowRight } from "react-icons/md";
import React from "react";
import TimeLineSection from "../components/cors/HomePage/TimeLineSection";
import { useDispatch, useSelector } from "react-redux";
import ReviewSlider from "../components/common/ReviewSlider";
import { setProgress } from "../slices/loadingBarSlice";

const Home = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.profile.user);
  const navigate = useNavigate()

  return (
    <div className="w-full mx-auto">
      {/* section 1 */}
      <header className="bg-richblack-900">
        <div className="max-w-maxContent mx-auto w-11/12">
          {/* Hero section */}
          <div id="Home" className="relative mx-auto pt-16 flex flex-col items-center text-richblack-5 justify-between text-center">
            {!(token === null) ? (
              <div className="flex flex-col items-center gap-y-5">
                <div className="text-3xl xl:text-4xl border-b border-richblack-600 pb-6 flex flex-col md:flex-row gap-3">
                  <p>Welcome Back</p> <HighlightText text={user.firstName + " " + user.lastName} />
                </div>
                <div onClick={() => {
                  navigate("/dashboard/my-profile");
                  dispatch(setProgress(100));
                }} className="mx-auto group cursor-pointer rounded-full bg-richblack-700 font-bold text-richblack-200 transition-all duration-200 active:scale-95 shadow-sm shadow-richblack-300 border border-richblack-600">
                  <div className="flex items-center gap-3 rounded-full py-1 transition-all duration-200 text-lg group-hover:bg-richblack-800 px-5">
                    <p>Go to Dashboard</p>
                    <MdArrowRight className="group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ) : (
              <Link to={"/signup"} className="rounded-full">
                <div className="mx-auto group rounded-full bg-richblack-700 font-bold text-richblack-200 transition-all duration-200 active:scale-95 shadow-sm shadow-richblack-300">
                  <div className="flex items-center gap-2 rounded-full py-1 transition-all duration-200 text-lg group-hover:bg-richblack-800 px-3">
                    <p>Become an instructor</p>
                    <MdArrowRight />
                  </div>
                </div>
              </Link>
            )}

            <div className="text-3xl xl:text-4xl  text-center font-semibold mt-6 max-w-[90%]">
              Empower Your Future with
              <HighlightText text={"Coding Skills"} />
            </div>

            <div className="md:w-[75%] text-center text-lg text-richblack-200 mt-4 font-semibold">
              With our online coding courses, you can learn at your own pace,
              from anywhere in the world, and get access to a wealth of
              resources, including hands-on projects, quizzes, and personalized
              feedback from instructors.
            </div>
          </div>

          {/* Hero section CTA buttons */}
          <div className="flex gap-7 mt-10 justify-center text-richblack-5">
            <CtaButton active="true" linkTo={"/signup"}>
              Learn more
              <MdArrowRight />
            </CtaButton>
            <CtaButton active={false} linkTo={"/login"}>
              Book a Demo
            </CtaButton>
          </div>

          {/* Hero section video  */}
          <div className="shadow-blue-200 flex justify-center mt-20 min-w-full">
            <div className="relative w-full border border-yellow-100 flex justify-center">
              <div className="w-full h-full absolute top-[0px] left-[50%] translate-x-[-50%] blur-3xl z-[5] bg-richblack-500"></div>
              <video
                muted
                loop
                autoPlay
                 className="relative w-full bg-richblack-800 z-[5] border-2 border-white min-w-full"
                src={banner}
              ></video>
              <div className="absolute h-full min-w-full right-[-1%] bottom-[-2%] z-[4] border-2 bg-white"></div>
            </div>
          </div>

          <div className="py-10">
            {/*  Code block 1 */}
            <div>
              <CodeBlock
                position={"lg:flex-row"}
                heading={
                  <div className="text-3xl xl:text-4xl  font-semibold">
                    Unlock Your <HighlightText text={"Coding Potantial"} />
                    with our online courses
                  </div>
                }
                subheading={
                  "Our courses are designed and taught by industry experts who have years of experience in coding and are passionate about sharing their knowledge with you."
                }
                ctaButton1={{
                  text: "Try it yourself",
                  linkTo: "/signup",
                  active: true,
                }}
                ctaButton2={{
                  text: "Learn more",
                  linkTo: "/login",
                  active: false,
                }}
                code={`#include <iostream>

            int main() 
            {
                std::cout 
                    << "ECHO is best" 
                    << std::endl;
                    
                return 0;
            }`}
              />
            </div>
            {/*  Code block 2 */}
            <div>
              <CodeBlock
                position={"lg:flex-row-reverse"}
                heading={
                  <div className="text-3xl xl:text-4xl font-semibold">
                    Start <HighlightText text={"Coding in Seconds"} />
                  </div>
                }
                subheading={
                  "Go ahead, give it a try. Our hands on learning envirionment means you'll be writing real code from your very first lesson."
                }
                ctaButton1={{
                  text: "Continue Lesson",
                  linkTo: "/signup",
                  active: true,
                }}
                ctaButton2={{
                  text: "Learn more",
                  linkTo: "/login",
                  active: false,
                }}
                code={`<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>ECHO is Best</title>
                    </head>
                    <body>
                        <h1>ECHO is Best</h1>
                    </body>
                    </html>`}
              />
            </div>
          </div>

          <div>
            <ExploreMore />
          </div>
        </div>
      </header>

      {/* section 2 */}
      <section className="bg-white py-10">
        <div className="max-w-maxContent mx-auto my-0 lg:mt-32 w-11/12">
          <div className="lg:py-5 flex flex-col justify-between items-center">
            <div className="flex items-center justify-center gap-5">
              <CtaButton linkTo={"/about"} active="true">
                Explore full catalog
                <MdArrowRight />
              </CtaButton>
              <CtaButton linkTo={"/about"} active={false}>Learn more</CtaButton>
            </div>
          </div>

          <div className="flex justify-between items-center flex-col lg:flex-row gap-5 md:gap-10 my-10 text-richblack-900">
            <div className="text-3xl   xl:text-4xl  w-11/12 text-center lg:text-start lg:w-[50%] font-bold">
              <h3>
                Get the skills you need for a
                <HighlightText text={"Job that is in demand."} />
              </h3>
            </div>
            <div className="flex flex-col items-center lg:items-start text-center w-full lg:text-start lg:w-[50%] gap-10">
              <p className="text-xl font-semibold text-richblack-500 w-11/12">
                The modern Echo is the dictates its our terms, Today, to be a
                compititive specialist requires more than professional skills.
              </p>
              <CtaButton linkTo={"/about"} active="true">Learn more <MdArrowRight /></CtaButton>
            </div>
          </div>

          {/* timeline section */}
          <TimeLineSection />

          <LearningLanguageSection />
        </div>
      </section>

      {/* section 3 */}
      <section className="bg-richblack-900">
        <div className="max-w-maxContent mx-auto">
          <div className="mx-auto w-11/12">
            <div className="flex justify-between items-center py-10 lg:py-16">
              <InstructorSection />
            </div>
            <div className="py-10 flex flex-col gap-10">
              <h2 className="text-center text-richblack-5 text-3xl xl:text-4xl  font-bold">
                Reviews from other <HighlightText text={"learners"} />
              </h2>
              <div>
                <ReviewSlider />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
