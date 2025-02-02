import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import ActionButton from "../../common/ActionButton"
import { MdArrowBack } from "react-icons/md";
import { IoMdArrowDropdown } from "react-icons/io";
import { IoCheckmarkDone } from "react-icons/io5";
import ScrollLock from '../../../hooks/ScrollLock';


const VideoSideBar = ({ reviewModal, setReviewModal, sideBarActive, setSideBarActive }) => {

  const [activeStatus, setActiveStatus] = useState("");
  const [videoBarActive, setVideoBarActive] = useState("");
  const { sectionId, subSectionId } = useParams();
  const navigate = useNavigate()
  const location = useLocation();
  const {
    courseSectionData,
    courseEntireData,
    totalNoOfLectures,
    completedLectures
  } = useSelector(state => state?.viewCourse)

  useEffect(() => {
    ; (() => {
      if (!courseSectionData.length) {
        return;
      }


      const currentSectionIndex = courseEntireData.courseContent.findIndex((data) => data?._id === sectionId)
      const currentSubSectionIndex = courseSectionData?.[currentSectionIndex]?.subSection.findIndex((data) => data?._id === subSectionId);
      const activeSubSectionId = courseSectionData[currentSectionIndex]?.subSection?.[currentSubSectionIndex]?._id;

      // set current section
      setActiveStatus(courseSectionData?.[currentSectionIndex]?._id);
      // set current subSection
      setVideoBarActive(activeSubSectionId);

    })()
  }, [courseSectionData, courseEntireData, location.pathname])


  return (
    <div className={`w-full bg-opec z-[12] transition-all duration-100 fixed h-screen top-0 ${sideBarActive ? "visible opacity-100" : "invisible opacity-0"}`} onClick={() => setSideBarActive(false)}>
      <div onClick={(e) => e.stopPropagation()} className={`bg-richblack-900 py-5 px-5 w-[320px] md:w-[500px] max-w-[500px] h-full z-[3] shadow-richblack-300 transition-all duration-300 absolute border-r border-richblack-600 ${!sideBarActive ? "translate-x-[-100%]" : "translate-x-0"}`}>
        <div className='flex flex-col w-full gap-3'>
          <span className='w-full mb-3'>
            <p onClick={() => navigate("/dashboard/enrolled-courses")} className='text-yellow-100 hover:text-yellow-200 transition-all duration-300 text-xl md:text-2xl cursor-pointer flex gap-3 hover:gap-5  items-center' active ><MdArrowBack /> Back to all courses</p>
          </span>
          <div className='flex justify-between gap-3 items-center flex-row-reverse'>
            <button onClick={() => setSideBarActive(false)} className='text-xl border-2 p-2 rounded-full hover:bg-richblack-5 hover:text-richblack-900 transition-all duration-300 cursor-pointer'>
              <span className='text-2xl'><MdArrowBack /></span>
            </button>
            <ActionButton active onClick={() => setReviewModal(true)} >Add review</ActionButton>
          </div>

          <div className='flex flex-col gap-1 my-3'>
            <p className='text-2xl'>{courseEntireData?.courseTitle}</p>
            <p className='text-richblack-300'>{completedLectures?.length} of {totalNoOfLectures} completed</p>
          </div>
        </div>

        <div className='py-3 flex flex-col gap-1'>
          {
            courseSectionData?.map((section, index) => (
              <div
                className='bg-richblack-800 cursor-pointer'
                onClick={() => setActiveStatus(section._id)}
                key={index}
              >
                <div>
                  <div className={` flex gap-3 items-center justify-between text-lg p-3`}>
                    <p className='line-clamp-1'>{section?.sectionName}</p>
                    <p className={`transition-all duration-300 ${activeStatus === section._id ? "rotate-180" : "rotate-0"}`}><IoMdArrowDropdown /></p>
                  </div>

                  {/* subsection  */}
                  <div>
                    {
                      activeStatus === section._id && (
                        <div className='flex flex-col'>
                          {
                            section?.subSection?.map((subSection, index) => (
                              <div
                                key={index}
                                className={`px-3 py-2 transition-all duration-300 flex gap-3 items-center justify-between border border-transparent text-lg hover:border hover:border-richblack-5 ${videoBarActive === subSection._id ? "text-richblack-900 bg-yellow-100 " : "bg-richblack-600 text-richblack-5"}`}
                                onClick={() => {
                                  navigate(`/view-course/${courseEntireData?._id}/section/${section._id}/sub-section/${subSection._id}`)
                                  setVideoBarActive(subSection?._id)
                                }}
                              >
                                <span className={`line-clamp-1 `}>
                                  {
                                    subSection?.title
                                  }
                                </span>
                                {
                                  completedLectures?.includes(subSection?._id) &&
                                  <span className='bg-caribbeangreen-300 text-richblack-900 rounded-full p-1'><IoCheckmarkDone /></span>
                                }
                              </div>
                            ))
                          }
                        </div>
                      )
                    }
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
      {
        sideBarActive && <ScrollLock />
      }
    </div>
  )
}

export default VideoSideBar