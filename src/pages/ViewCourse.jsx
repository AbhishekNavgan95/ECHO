import React, { useEffect } from 'react'
import { useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import VideoSideBar from '../components/cors/ViewCourse/VideoSideBar'
import { useSelector, useDispatch } from "react-redux";
import { getFullDetailsOfCourse } from '../services/operations/courseDetailsAPI';
import { setCompletedLectures, setCourseSectionData, setEntireCourseData, setTotalNoOfLectures } from '../slices/viewCourseSlice';
import ReviewModal from "../components/cors/ViewCourse/ReviewModal"
import toast from 'react-hot-toast';
import { SyncLoader } from 'react-spinners';

const ViewCourse = () => {

    const { token } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [reviewModal, setReviewModal] = useState();
    const { courseId } = useParams();
    const [sideBarActive,setSideBarActive] = useState(true);
    const dispatch = useDispatch();

    const setCourseSpecificDetails = async () => {
        setLoading(true);
        const courseData = await getFullDetailsOfCourse(courseId, token, dispatch);
        dispatch(setCourseSectionData(courseData?.courseDetails?.courseContent));
        dispatch(setEntireCourseData(courseData?.courseDetails))
        dispatch(setCompletedLectures(courseData?.completedVideos))

        let lectures = 0
        courseData?.courseDetails?.courseContent?.forEach((sec) => {
            lectures += sec?.subSection?.length
        })
        dispatch(setTotalNoOfLectures(lectures))
        setLoading(false);
    }

    useEffect(() => {
        setCourseSpecificDetails();
    }, [])

    return (
        <div className='relative text-richblack-5'>
            {
                !loading ?
                    <div className=' flex'>
                        <VideoSideBar setSideBarActive={setSideBarActive} sideBarActive={sideBarActive} reviewModal={reviewModal} setReviewModal={setReviewModal} />
                        <div className='w-full min-h-screen px-5 py-5 xl:px-24 xl:py-10 border-l border-richblack-600 bg-richblack-800 flex items-start'>
                            <Outlet context={{sideBarActive, setSideBarActive}}/>
                        </div>
                    </div>
                    : <div className='flex flex-col min-h-screen items-center justify-center'>
                        <SyncLoader color='#E7C009' />
                    </div>
            }
            {
                reviewModal && <ReviewModal reviewModal={reviewModal} setReviewModal={setReviewModal} />
            }
        </div>
    )
}

export default ViewCourse