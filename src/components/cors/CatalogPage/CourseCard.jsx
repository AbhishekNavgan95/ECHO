import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import getAvgRating from '../../../utils/avgRating'
import RatingStars from '../../common/RatingStars'

const CourseCard = ({ course, height, }) => {

  const [averageReviewCount, setAverageReviewCount] = useState(0);

  useEffect(() => {
    const count = getAvgRating(course?.ratingAndReviews)
    setAverageReviewCount(count);
  }, [course])

  return (
    <Link to={`../courses/${course?._id}`} >
      <div className='flex flex-col gap-3 overflow-hidden group py-2'>
        <div className='overflow-hidden rounded-lg relative '>
          <img className={`aspect-video w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${height}`} src={course?.thumbnail} alt="thumbnail" loading="lazy"  />
        </div>
        <div className='flex flex-col items-center lg:items-start gap-1'>
          <h4 className='text-xl line-clamp-1 font-semibold'>{course?.courseTitle}</h4>
          <h4 className='text-lg text-yellow-100'>By {` ${course?.instructor?.firstName}  ${course?.instructor?.lastName} `}</h4>
          <div className='flex items-center gap-3'>
            <span className='flex gap-2 items-center'>
              {averageReviewCount || 0}
              <RatingStars reviewCount={averageReviewCount} />
            </span>
            <span>{course?.ratingAndReviews?.length} Reviews</span>
          </div>
          <h4 className='text-lg'>Rs. {course?.price}</h4>
        </div>
      </div>
    </Link>
  )
}

export default CourseCard