import React from 'react'
import HighlightText from '../../common/HighlightText'
import Compare_with_others from "../../../assets/Images/Compare_with_others.png"
import Know_your_progress from "../../../assets/Images/Know_your_progress.png"
import Plan_your_lessons from "../../../assets/Images/Plan_your_lessons.png"
import CtaButton from '../../common/CtaButton'
import {MdArrowRight} from "react-icons/md"

const LearningLanguageSection = () => {
  return (
    <div className=' text-richblack-900 lg:mb-5 lg:mt-16 '>
        <div className=''>
            <h3 className='text-3xl xl:text-4xl font-bold text-center'>Your swiis knife for <HighlightText text={"learning any language."}/></h3>
            <p className='text-center text-richblack-300 w-full lg:w-2/3 mx-auto text-xl mt-3 font-semibold'>Using spin making learning multiple language easy. with 20+ languages realistic voice-over, Progress tracking, custom schedule and more...</p>
        </div>
        <div className='flex flex-col md:flex-row justify-center items-center my-10 relative'>
            <img  loading="lazy" src={Know_your_progress}  className='-mb-36 md:mb-0 md:-mr-32 relative hover:lg:z-[4] hover:lg:scale-105 transition-all duration-300 w-[300px] md:w-full'  alt="Know_your_progress" />
            <img  loading="lazy" src={Compare_with_others}  alt="Compare_with_others" className=' relative hover:lg:z-[4] hover:lg:scale-105 transition-all duration-300 w-[300px] md:w-full' />
            <img  loading="lazy" src={Plan_your_lessons} className='-mt-36 md:mt-0 md:-ml-32 relative hover:lg:z-[4] hover:lg:scale-105 transition-all duration-300 w-[300px] md:w-full' alt="Plan_your_lessons" />
        </div>
        <div className='flex justify-center'>
            <CtaButton active="true" linkTo={"/signup"}>
                Learn more
                <MdArrowRight />
            </CtaButton>
        </div>
    </div>
  )
}

export default LearningLanguageSection