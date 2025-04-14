import React from 'react'

const DangerButton = ({
    style,
    action,
    children,
}) => {
  return (
    <button
    className={`${style} w-min flex gap-3 text-sm md:text-base rounded-lg items-center px-4 text-richblack-5 text-nowrap py-1 bg-[#721414]`}
        onClick={action}
    >{children}</button>
  )
}

export default DangerButton