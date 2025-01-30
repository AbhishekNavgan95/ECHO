import React from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactStars from "react-stars";
import { MdDelete } from "react-icons/md";
import { removeFromCart } from "../../../../slices/CartSlice";
import ActionButton from "../../../common/ActionButton";
import RatingStars from "../../../common/RatingStars";
import { Link, useNavigate } from "react-router-dom";

const CartCourses = () => {

  const { cartItems } = useSelector(state => state.cart);
  const dispatch = useDispatch();

  const calculateAvgRating = (course) => {
    let avgRating = 0;
    if(course.length > 0) {
      avgRating = course.reduce((acc, curr) => acc + curr.rating , 0)
      avgRating = avgRating / course.length
    } 
    return avgRating;
  }

  return (
    <div className="flex flex-col text-richblack-5 gap-3">
      {cartItems.map((course, index) => (
        <Link
        to={`../../courses/${course?._id}`}
        key={index}
          className="w-full flex flex-col cursor-pointer lg:flex-row gap-y-3 items-start lg:items-center justify-between border border-richblack-600 hover:bg-richblack-800 transition-all duration-300 rounded-lg p-3"
        >
          <div className="w-full flex flex-col md:flex-row gap-5 items-stretch md:items-center">
            <img className="w-full aspect-video md:w-[250px] rounded-lg object-cover" src={course?.thumbnail} loading="lazy" alt="thumbnail" />
            <div className="flex items-start flex-col gap-2">
              <h3 className="text-xl text-start font-semibold line-clamp-1">{course?.courseTitle}</h3>
              <p className="py-1 border text-yellow-100 border-yellow-100 text-sm font-semibold w-max px-3 rounded-lg ">{course?.category?.name}</p>
              <div className="flex items-center gap-3">
                <div className="text-xl">{calculateAvgRating(course?.ratingAndReviews)}</div>
                <RatingStars reviewCount={calculateAvgRating(course?.ratingAndReviews)} />
              </div>
              <p className="text-richblack-300">Total Ratings : {course?.ratingAndReviews?.length}</p>
            </div>
          </div>
          <div className="w-full lg:w-max gap-5 flex items-center justify-between lg:justify-end">
            <p className="text-xl text-nowrap">
              {
                `Rs. ${course?.price}`
              }
            </p>
            <ActionButton
              active="true"
              className="text-center flex items-center px-4 py-2 rounded-md text-lg bg-yellow-100 hover:bg-yellow-200 focus:hover:bg-yellow-200 text-black active:scale-95 focus:scale-95 transition-all duration-200 shadow-sm shadow-richblack-300 gap-3"
              onClick={() => dispatch(removeFromCart(course?._id))}
            >
              <span className="flex items-center gap-3">
                <MdDelete /> Remove
              </span>
            </ActionButton>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CartCourses;
