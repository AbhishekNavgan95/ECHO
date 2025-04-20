import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getCategoryAndCourseDetails } from '../../../services/operations/courseDetailsAPI';
import { GiCardKingClubs } from 'react-icons/gi';
import CategoryList from './adminDashboard/CategoryList'
import { SyncLoader } from "react-spinners"

const AdminDashboard = () => {

    const [loading, setLoading] = useState(true);
    const [categoryData, setCategoryData] = useState([]);
    const { token } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const fetchCategoryData = async (token) => {
        setLoading(true);
        const res = await getCategoryAndCourseDetails(token, dispatch);
        setCategoryData(res);
        setLoading(false);
    }

    useEffect(() => {
        fetchCategoryData(token);
    }, []);
    return (
        <div className="w-full ">
            <div className="flex flex-col w-full px-5 gap-10 justify-start mx-auto py-10 xl:py-20  min-h-[calc(100vh-6rem)]" >
                <h2 className="text-3xl xl:text-4xl font bold">Admin Panel</h2>
                <section className="flex flex-col md:flex-row gap-5 justify-between items-center bg-richblack-900 border border-richblack-600 p-5 lg:p-10 rounded-lg">
                    {
                        loading
                            ? <div className='w-full flex justify-center text-xl'>
                                <SyncLoader color='#E5915C' />
                            </div>
                            : categoryData.length > 0
                                ?
                                <CategoryList categoryData={categoryData} />
                                : <div className='text-center w-full text-xl'>No data Found</div>
                    }
                </section>
            </div >
        </div >
    )
}

export default AdminDashboard