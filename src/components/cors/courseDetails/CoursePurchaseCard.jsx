import React from 'react'
import { MdOutlineSwitchVideo } from "react-icons/md";
import { MdAccessAlarm } from "react-icons/md";
import { MdDevices } from "react-icons/md";
import { TiDocumentText } from "react-icons/ti";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaShare } from "react-icons/fa";
import { MdOutlineCurrencyRupee } from "react-icons/md";
import ActionButton from '../../common/ActionButton';



const CoursePurchaseCard = ({ handleAddToCart, setConfirmationModal, handleBuyCourse, courseData, handleShare }) => {

  const { user } = useSelector(state => state.profile);
  const { token } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <div className='bg-richblack-800 rounded-lg border border-richblack-600 text-richblack-5 overflow-hidden flex flex-col group p-3 max-w-[400px]'>
      <div className='overflow-hidden rounded-lg lg:aspect-video flex items-center' >
        <img  loading="lazy"  className='w-full group-hover:scale-105 transition-scale duration-300 ' src={courseData?.thumbnail} alt="thumbnail" />
      </div>
      <div className=' flex flex-col my-3 gap-2'>
        <div className='flex items-center justify-between px-4'>
        <h4 className='text-2xl font-bold flex items-center'><MdOutlineCurrencyRupee /> {courseData?.price}</h4>
        <button className='mt-2 w-max text-yellow-50 hover:text-yellow-100 active:scale-95 transition-all duration-300 text-start flex items-center gap-3' onClick={handleShare}> Share <FaShare /></button>
        </div>
        <div className='flex flex-col gap-3 mt-2'>
          <ActionButton
          active
          onClick={() =>
              user && courseData?.studentsEnrolled.includes(user?._id) ? navigate("/dashboard/enrolled-courses") : handleBuyCourse(courseData?._id)
            }
>
            {
              user && courseData?.studentsEnrolled.includes(user?._id) ? "Go to course" : "Buy now"
            }
          </ActionButton>
          {
            (!courseData?.studentsEnrolled?.includes(user?._id)) &&
            <ActionButton onClick={() => handleAddToCart(courseData)}>Add to Cart</ActionButton>
          }
        </div>
        <p className='text-sm mt-2 mb-1 text-center text-richblack-100'>30-Day Money-Back Guarantee</p>
        <div className='flex flex-col gap-1 items-center lg:items-start'>
          <p> This course Includes : </p>
          <p className='flex gap-1 text-sm items-center text-caribbeangreen-200'>< MdAccessAlarm /> Full Lifetime access</p>
          <p className='flex gap-1 text-sm items-center text-caribbeangreen-200'> < MdDevices />Access on mobile and TV</p>
          <p className='flex gap-1 text-sm items-center text-caribbeangreen-200'> <TiDocumentText />Cirtificate of completion</p>
        </div>
        
      </div>
    </div>
  )
}

export default CoursePurchaseCard