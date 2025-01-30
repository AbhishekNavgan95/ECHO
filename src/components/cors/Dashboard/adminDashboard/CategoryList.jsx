import React, { useEffect, useState } from 'react'
import { MdOutlineCurrencyRupee } from "react-icons/md";
import { Link, json } from 'react-router-dom';
import CtaButton from "../../../common/CtaButton"
import { MdArrowRight } from "react-icons/md"

const CategoryList = ({ categoryData }) => {
  const [currentCategory, setCurrentCategory] = useState([]);

  const getFirstTenWords = (text) => {
    return text.split(" ").slice(0, 20).join(" ");
  }

  useEffect(() => {
    setCurrentCategory(categoryData && categoryData[0])
  }, [categoryData])

  const changeHandler = (e) => {
    setCurrentCategory(categoryData.filter((category) => e.target.value === category._id)[0])
  }

  return (
    <div className='flex justify-between items-stretch flex-col gap-5 text-richblack-5 w-full'>
      <span className='self-end '>
      <CtaButton linkTo={"../add-category"} active >Create New Category <MdArrowRight /></CtaButton>
      </span>
      <section className='min-w-6/12 w-full  self-start text-nowrap flex flex-col rounded-lg shadow-sm shadow-richblack-300'>
        <select
          name="category"
          id="category"
          onChange={changeHandler}
          className='w-full bg-richblack-800 overflow-hidden py-2 px-4 text-xl outline-none rounded-lg focus:outline-1'
        >
          {
            categoryData?.length > 0 && categoryData?.map(
              (category) => (
                <option key={category?._id} className='' value={category?._id}>{category?.name}</option>
              ))
          }
        </select>
      </section>
      <section className='min-w-6/12 w-full'>
        {
          <div className='flex flex-col gap-3'>
            {
              currentCategory?.courses?.length > 0 ?
                currentCategory?.courses?.sort((a, b) => (a?.courseTitle || '').localeCompare(b?.courseTitle || '')).map((course) => (
                  <Link key={course?._id} to={`/courses/${course?._id}`}>
                    <div className='justify-start group bg-richblack-800 border border-richblack-600 p-3 rounded-lg flex flex-col md:flex-row gap-3'>
                      <div className='overflow-hidden w-full rounded-lg md:max-w-[300px] border border-richblack-600'>
                        <img loading="lazy" src={course?.thumbnail} className='aspect-video w-full object-cover group-hover:scale-105 transition-all duration-300' alt="thumbnail" />
                      </div>
                      <div className='flex flex-col md:items-start items-center gap-1'>
                        <p className='text-xl md:text-start text-center'>{course?.courseTitle}</p>
                        <p className=' text-richblack-300 md:text-start text-center'>{getFirstTenWords(course?.courseDescription)}</p>
                        <p className='text-richblack-300 capitalize md:text-start text-center'>{`${course?.instructor?.firstName} ${course?.instructor?.lastName}`}</p>
                        <p className='text-richblack-300 flex items-center text-xl'> <MdOutlineCurrencyRupee />{course?.price}</p>
                      </div>
                    </div>
                  </Link>
                )) : <div className='text-center text-xl my-10'>No courses Available</div>}
          </div>
        }
      </section>
    </div>
  )
}

export default CategoryList