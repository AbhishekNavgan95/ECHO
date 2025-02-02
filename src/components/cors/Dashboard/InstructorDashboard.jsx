import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { fetchInstructorCourses } from "../../../services/operations/courseDetailsAPI"
import { getInstructorData } from '../../../services/operations/profileAPI';
import InstructorChart from './InstructorDashboard/InstructorChart';
import { useNavigate } from 'react-router-dom';
import CtaButton from "../../common/CtaButton"
import { MdOutlineCurrencyRupee } from "react-icons/md";
import { useDispatch } from 'react-redux';

const InstructorDashboard = () => {
    const [instructorData, setInstructorData] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const { token } = useSelector(state => state.auth);
    const { user } = useSelector(state => state.profile);
    const navigate = useNavigate()
    const dispatch = useDispatch();

    const getCourseDataWithStats = async () => {
        setLoading(true);
        const instructorApiData = await getInstructorData(token, dispatch);
        const result = await fetchInstructorCourses(token, dispatch);

        if (instructorApiData) {
            setInstructorData(instructorApiData);
        }

        if (result) {
            setCourses(result);
        }

        setLoading(false);
    }
    useEffect(() => {
        getCourseDataWithStats();
    }, [])

    const totalAmountGenerated = instructorData?.reduce((acc, curr) => acc + curr.totalAmountGenerated, 0);
    const totalStudents = instructorData?.reduce((acc, curr) => acc + curr.totalStudentsEnrolled, 0);

    return (
        <div className="w-full">
            <div className="flex flex-col w-full px-5 gap-10 justify-center mx-auto py-10 xl:py-20">
                <h2 className="text-3xl xl:text-4xl font bold">Dashboard</h2>
                <div className='grid grid-cols-1 gap-5 w-full'>
                    <section className="border border-richblack-600 shadow-xs shadow-richblack-100 flex flex-col md:flex-row gap-5 justify-center items-center bg-richblack-900 p-5 lg:p-10 rounded-lg w-full">
                        {loading
                            ? <div className='text-xl flex items-center justify-center'>Loading...</div>
                            : courses.length > 0
                                ? <InstructorChart courses={instructorData} />
                                : <div>No courses Fount</div>
                        }
                    </section>
                    <section className="border border-richblack-600 shadow-xs shadow-richblack-100 flex flex-col gap-5 justify-start items-start bg-richblack-900 p-5 lg:p-10 rounded-lg w-full">
                        <p className='text-2xl'> Statistics</p>
                        <div className='text-lg flex flex-col gap-3'>
                            <p>Total Courses</p>
                            <p className='text-3xl'>{courses?.length}</p>
                        </div>
                        <div className='text-lg flex flex-col gap-3'>
                            <p>Total Students</p>
                            <p className='text-3xl'>{totalStudents || 0}</p>
                        </div>
                        <div className='text-lg flex flex-col gap-3'>
                            <p>Total Income</p>
                            <p className='text-3xl flex gap-1 items-center'><MdOutlineCurrencyRupee />{totalAmountGenerated || 0}</p>
                        </div>
                    </section>
                    <section className="border border-richblack-600 shadow-xs shadow-richblack-100 lg:col-span-2 flex flex-col gap-5 justify-between items-center bg-richblack-900 p-5 lg:p-10 rounded-lg w-full">
                        <div className='flex justify-between w-full'>
                            <p className='text-2xl'>
                                My Courses
                            </p>
                            <p className='cursor-pointer text-yellow-100 hover:text-yellow-300 transition-all duration-300' onClick={() => navigate("../my-courses")}>View All</p>
                        </div>
                        <div className='flex flex-col md:flex-row gap-5'>
                            {
                                courses.length > 0 ? courses.sort((a, b) => b?.studentsEnrolled?.length - a.studentsEnrolled?.length).slice(0, 3).map(course =>
                                    <div key={course._id} className='w-full flex flex-col group gap-1 text-lg border border-richblack-600 p-3 rounded-lg bg-richblack-900 shadow-sm shadow-richblack-600'>
                                        <div className='w-full rounded-sm overflow-hidden '>
                                            <img src={course?.thumbnail} className='aspect-video w-full group-hover:scale-105 transition-all duration-300'  loading="lazy"  alt="thumbnail" />
                                        </div>
                                        <p className='line-clamp-1'>{course?.courseTitle}</p>
                                        <span className='flex gap-3'>
                                            <p>
                                                {course?.studentsEnrolled?.length} Student
                                            </p>
                                            <p className='flex items-center gap-1'>
                                                <MdOutlineCurrencyRupee />
                                                {course?.price}
                                            </p>
                                        </span>
                                    </div>
                                )
                                    : <div className='flex flex-col items-center gap-3'>
                                        <div className='text-xl'>You have not created any course yet</div>
                                        <CtaButton active linkTo={"../add-course"} >Create now</CtaButton>
                                    </div>
                            }
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default InstructorDashboard