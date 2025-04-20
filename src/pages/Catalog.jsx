import React, { useEffect, useState } from 'react'
import { getCatalogPageData } from "../services/operations/PageAndComponentData"
import { useDispatch, useSelector } from 'react-redux';
import { MdOutlineCurrencyRupee } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { SyncLoader } from 'react-spinners';

const Catalog = () => {

    const { data: categories } = useSelector(state => state.category)
    const [currentCategory, setCurrentCategory] = useState(null);
    const [sort, setSort] = useState('asc')
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        setCurrentCategory(categories[0])
        setCourses([])
    }, [categories])

    useEffect(() => {
        setCourses(prev => {
            const sortedCourses = [...prev];
            return sort === 'asc'
                ? sortedCourses.sort((a, b) => a.price - b.price)
                : sortedCourses.sort((a, b) => b.price - a.price);
        });
    }, [sort]);

    useEffect(() => {
        const fetchCatalogPageData = async () => {
            setLoading(true)
            const response = await getCatalogPageData(currentCategory?._id, dispatch);
            setCourses(response?.sort((a, b) => a.price - b.price));
            setLoading(false)
        }
        if (currentCategory) {
            fetchCatalogPageData();
        }
    }, [currentCategory])

    return (
        <div className="py-5 w-11/12 mx-auto">
            <section className="bg-richblack-900 min-h-[70vh] py-5 md:py-14 text-richblack-5 max-w-maxContent mx-auto">
                <div className='flex border-b gap-x-3 border-richblack-600 mb-5 pb-5'>

                    <Select value={currentCategory} onValueChange={(val) => setCurrentCategory(val)}>
                        <SelectTrigger className="w-[180px] border-richblack-600 text-richblack-25 lg:hidden flex gap-x-2">
                            <SelectValue placeholder="Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            {
                                categories?.length > 0 && categories.map((category, index) => {
                                    return <SelectItem key={category?._id + index} value={category}>{category?.name}</SelectItem>
                                })
                            }
                        </SelectContent>
                    </Select>

                    <Select value={sort} onValueChange={(val) => setSort(val)}>
                        <SelectTrigger className="w-[180px] border-richblack-600 text-richblack-25 gap-x-2">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={'asc'}>Ascending</SelectItem>
                            <SelectItem value={'dsc'}>Descending</SelectItem>
                        </SelectContent>
                    </Select>

                </div>
                <div className='flex items-start gap-x-10 gap-y-5'>
                    <div className='hidden items-start lg:flex py-3 px-3 pr-10 flex-col gap-3 border-r border-richblack-700'>
                        {
                            categories?.length > 0 ? categories.map((category, index) => {
                                return (
                                    <button onClick={() => setCurrentCategory(category)} key={index} className={`${category?._id === currentCategory?._id ? "border-l-4 border-yellow-200 text-yellow-200 pl-3" : ""} text-sm transition-all text-start hover:text-yellow-200 duration-100 text-nowrap flex justify-between items-center gap-x-5 w-full`}>
                                        {
                                            category?.name
                                        }
                                        <p className={`${category?._id === currentCategory?._id ?"text-yellow-200" : "text-richblack-300"}`}>{category?.courses?.length}</p>
                                    </button>
                                )
                            }) : (
                                <div className='text-nowrap min-h-[200px] text-xs text-center flex items-center justify-center'>
                                    No categories found...
                                </div>
                            )
                        }
                    </div>
                    {
                        loading ? <p
                            className='w-full text-center col-span-2 min-h-[300px] flex items-center justify-center'
                        >
                            <SyncLoader color="#E5915C" />
                        </p> :
                            <div className='w-full grid grid-cols-2 xl:grid-cols-3 gap-5 place-items-start'>
                                {
                                    courses?.length > 0 && !loading ? courses.map((course, index) => {
                                        return (
                                            <CourseCard key={index} course={course} />
                                        )
                                    })
                                        : <p className='col-span-3 min-h-[300px] flex items-center justify-center mx-auto w-full text-center'>No courses found</p>
                                }
                            </div>
                    }
                </div>
            </section>
        </div>
    )
}

const CourseCard = ({ course }) => {

    const navigate = useNavigate();

    return (
        <div className="mx-auto">
            <img className='w-[320px] rounded-lg overflow-hidden aspect-video object-cover' src={course?.thumbnail} alt={course?.courseTitle} />
            <div className="w-full my-2">
                <p onClick={() => navigate(`/catalog/${course?._id}`)} className='text-sm md:text-base font-semibold line-clamp-2 cursor-pointer hover:underline'>{course?.courseTitle}</p>
                <p className='text-xs text-yellow-200'>{course?.instructor?.firstName + " " + course?.instructor?.lastName}</p>
                <p className='flex font-bold text-sm mt-1 items-center'><MdOutlineCurrencyRupee className='text-sm md:text-base' />{course?.price}</p>
            </div>
        </div>
    )
}

export default Catalog