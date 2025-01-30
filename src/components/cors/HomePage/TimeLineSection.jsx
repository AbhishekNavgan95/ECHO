import React from 'react'
import TimelineImage from "../../../assets/Images/TimelineImage.png"
import { timeline } from '../../../data/timeline'

const TimeLineSection = () => {

    return (
    <div className='my-10 lg:my-20 '>
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 nd:gap-2 justify-between">
            {/* timeline */}
            <div className="flex flex-col items-center lg:items-start gap-5 md:gap-10 w-full lg:w-2/5">
                {
                    timeline.map((elem, index) => {
                        return (
                            <div key={index} className='flex items-center gap-5 w-11/12 lg:w-full'>
                                <div className=''><img loading="lazy" src={elem.logo} className='w-[30px]' alt="logo" /></div>
                                <div>
                                    <h5 className='text-lg  text-richblack-900 font-bold'>{elem.heading}</h5>
                                    <p className='text-md  text-richblack-300'>{elem.description}</p>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
            {/* image */}
            <div className="flex flex-col w-11/12 lg:w-3/5 relative rounded-lg overflow-hidden md:overflow-visible md:rounded-none">
                <div className='overflow-hidden md:rounded-lg group'>
                    <img loading="lazy" className='w-full group-hover:scale-105 transition-scale delay-100 duration-300 ' src={TimelineImage} alt="timeline" />
                </div>
                <div className='w-auto lg:w-3/4 md:absolute left-[50%] bottom-0 md:translate-x-[-50%] md:translate-y-[50%] flex justify-center  gap-2 lg:gap-4 bg-caribbeangreen-700 text-richblack-5 uppercase py-5 px-5 md:rounded-lg '>
                    <div className='flex flex-col lg:flex-row  items-center gap-3 '>
                        <h3 className='text-4xl font-bold'>10+</h3>
                        <h4 className='text-caribbeangreen-300 text-sm text-center'>Years of Experience</h4>
                    </div>
                    <div className='flex flex-col lg:flex-row items-center gap-3 '>
                        <h3 className='text-4xl font-bold'>250+</h3>
                        <h4 className='text-caribbeangreen-300 text-sm text-center'>Types of Courses</h4>
                    </div>
                </div>
            </div>
        </div>
    </div>
    )
}

export default TimeLineSection