import React from 'react'
import HighlightText from '../../common/HighlightText'

const Quote = () => {
  return (
    <div className='text-2xl md:text-4xl font-semibold mx-auto pt-28 pb-8 text-center text-richblack-5 '>
      We are passionate about revolutionizing the way we learn. Our innovative platform combines
      <span className='bg-gradient-to-br  from-caribbeangreen-100 to-blue-100 text-transparent bg-clip-text font-bold'> {" "}technology,{" "}</span>
      <span className='bg-gradient-to-bl to-pink-200 from-yellow-200 text-transparent bg-clip-text font-bold'>
        {" "}expertise, {" "}
      </span>
      and
      <span className='bg-gradient-to-tr from-caribbeangreen-100 to-[#E5915C] text-transparent bg-clip-text font-bold'>
        {" "}community{" "}
      </span>
      to create an unparalleled educational experience.
    </div>
  )
}

export default Quote