import React, { useEffect, useState } from 'react'
import CtaButton from '../../common/CtaButton'
import { VscAdd } from "react-icons/vsc";
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorCourses } from "../../../services/operations/courseDetailsAPI"
import CoursesTable from './instructorCourses/CoursesTable';
import { useNavigate } from 'react-router-dom';
import { SyncLoader } from "react-spinners";

const MyCourses = () => {

    const { token } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCourses = async () => {
        const result = await fetchInstructorCourses(token, dispatch)
        if (result) {
            setCourses(result);
        }
    }

    useEffect(() => {
        fetchCourses();
    }, [])

    return (
        <div className="w-full">
            <div className="flex flex-col w-full px-5 gap-10 justify-center mx-auto py-10 xl:py-20">
                <div className='flex justify-between'>
                    <h2 className="text-3xl xl:text-4xl font bold">My Courses</h2>
                    <CtaButton linkTo={"../add-course"} active="true" ><span className='flex gap-3 items-center'>Add Course <VscAdd /></span></CtaButton>
                </div>
                <section className="flex flex-col xl:flex-row gap-5 justify-between items-center bg-richblack-900 border border-richblack-600 px-5 lg:px-10 py-10 rounded-lg">
                    {
                        courses 
                        ? <CoursesTable courses={courses} setCourses={setCourses} /> 
                        : <SyncLoader color="#E5915C" />
                    }
                </section>
            </div>
        </div>
    )
}

export default MyCourses