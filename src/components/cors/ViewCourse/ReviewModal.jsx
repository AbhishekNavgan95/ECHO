import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux'
import ReactStars from 'react-rating-stars-component';
import ActionButton from '../../common/ActionButton';
import ScrollLock from '../../../hooks/ScrollLock';
import { createRating } from '../../../services/operations/courseDetailsAPI';
import { MdClose } from "react-icons/md";

const ReviewModal = ({ reviewModal, setReviewModal }) => {

  const { user } = useSelector(state => state.profile);
  const { token } = useSelector(state => state.auth);
  const {courseEntireData} = useSelector(state => state.viewCourse)
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    setValue("courseReviewData", "");
    setValue("courseRating", 0);

  }, [])

  const onSubmit = async (data) => {
    await createRating({ courseId:courseEntireData._id, rating: data?.courseRating, review: data.reviewField }, token, dispatch)
    setReviewModal(false);
  }

  const ratingChanged = (newRating) => {
    setValue("courseRating", newRating);
  }

  return (
    <div className='fixed z-[16] top-0 w-full bg-opec text-richblack-5 flex items-center justify-center h-full' onClick={() => setReviewModal(false)}>
      <div className='flex flex-col gap-3 bg-richblack-800 p-5 rounded-lg mx-5' onClick={(e) => e.stopPropagation()}>
        <div className='text-xl flex justify-between'>
          <p className=''>Add Review</p>
          <button onClick={() => setReviewModal(false)}>
            <MdClose />
          </button>
        </div>

        {/* modal body */}
        <div>
          <div className='flex items-center justify-center flex-col gap-3 pt-3'>
            <img src={user?.image}  loading="lazy" className='rounded-full w-[100px] aspect-square border border-richblack-600 object-cover' alt="image" />
            <div className='text-xl flex items-center flex-col gap-1'>
              <p>{user?.firstName} {user?.lastName}</p>
              <p className='text-lg text-richblack-300'>Posting Publically</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col w-full items-center gap-5' >
            <ReactStars
              count={5}
              onChange={ratingChanged}
              size={30}
              activeColor={'#E7C009'}
            />

            <div className='space-y-3'>
              <label className='text-lg' htmlFor="reviewField">your Experience</label>
              <textarea
                name="reviewField"
                placeholder='Write your Experience here...'
                id="reviewField"
                cols="50"
                rows="5"
                {...register("reviewField", { required: true })}
                className='text-xl bg-richblack-700 w-full py-3 px-4 rounded-lg focus:outline-none shadow-sm shadow-richblack-300'
              ></textarea>
              {
                errors.reviewField && <span className="text-xs text-pink-200">Please Add your Experience</span>
              }
            </div>
            <div className='flex self-end gap-3'>
              <ActionButton onClick={() => setReviewModal(false)}>Cancel</ActionButton>
              <ActionButton active type={"submit"} >Submit</ActionButton>
            </div>
          </form>
        </div>
      </div>
      <ScrollLock/>
    </div>
  )
}

export default ReviewModal