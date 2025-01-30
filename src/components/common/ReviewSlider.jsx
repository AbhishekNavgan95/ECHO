import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"
import { Autoplay, FreeMode, Navigation } from 'swiper/modules'
import ReactStars from 'react-stars'
import { apiConnector } from "../../services/apiconnector";
import { FaSearch } from "react-icons/fa";
import { ratingsEndpoints } from '../../services/apis'

const ReviewSlider = ({reviewArray}) => {

    const [reviews, setReviews] = useState([]);

    const allReviews = async () => {
        const res = await apiConnector("GET", ratingsEndpoints.REVIEWS_DETAILS_API)
        // console.log("response : ", res);
        if (res?.data?.success) {
            setReviews(res?.data?.data)
        }
    }

    useEffect(() => {
        if(!reviewArray) {
            allReviews();
        } else {
            setReviews([...reviewArray])
        }
    }, [])

    return (
        <div className='text-richblack-5 my-5'>
            <Swiper
                slidesPerView={3}
                spaceBetween={30}
                // loop={true}
                pagination={{
                    clickable: true,
                }}
                breakpoints={{
                    '@0.00': {
                        // centeredSlides: true,
                        slidesPerView: 1,
                        spaceBetween: 10,
                    },
                    '@0.75': {
                        slidesPerView: 2,
                        spaceBetween: 20,
                    },
                    '@1.00': {
                        slidesPerView: 3,
                        spaceBetween: 20,
                    },
                }}
                modules={[FreeMode]}
                className="mySwiper cursor-grab	active:cursor-grabbing"
            >
                {
                    reviews?.length > 0
                        ? (
                            reviews?.map(review => <SwiperSlide key={review?._id} className=''>
                                <div className='p-5 border select-none border-richblack-600 bg-richblack-800 divide-y divide-richblack-600 rounded-lg flex flex-col gap-3 h-full'>
                                    <div className='flex items-center gap-5 pb-3'>
                                        <img  loading="lazy"  src={review?.user?.image} className='max-w-[70px] border border-richblack-600 object-cover rounded-full aspect-square' alt="user" />
                                        <div className='space-y-1'>
                                            <p className=''>{review?.user?.firstName + " " + review?.user?.lastName}</p>
                                            <p className='line-clamp-1 text-richblack-300'>{review?.course?.courseTitle}</p>
                                            <ReactStars className='pointer-events-none' edit={false} value={review?.rating} />
                                        </div>
                                    </div>
                                    <div className='flex flex-col gap-3 pt-3'>
                                        <p className='line-clamp-4 text-lg'>{review?.review}</p>
                                    </div>
                                </div>
                            </SwiperSlide>
                            )
                        )
                        : <div className='text-center text-xl flex justify-center gap-3 items-center'>
                            <FaSearch /> No reviews Found...
                        </div>

                }
            </Swiper>
        </div>
    )
}

export default ReviewSlider 