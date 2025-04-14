import React from 'react'

const ActionButton = ({
    onClick,
    className,
    active= false,
    disabled = false,
    type = null,
    children,
}) => {
  return (
  <button 
  disabled={disabled}
    type={type}
    className={
        `text-center text-nowrap flex items-center justify-center px-2 py-1 md:px-4 md:py-1 rounded-md text-sm md:text-base active:scale-95 focus:scale-95 transition-all duration-200 shadow-sm shadow-richblack-300
        ${active 
          ? "bg-yellow-200 hover:bg-yellow-400 focus:bg-yellow-400 text-black " 
          : "bg-richblack-700 hover:bg-richblack-800 focus:bg-richblack-800 text-richblack-25"}
          ${disabled ? "bg-yellow-700 cursor-not-allowed hover:bg-yellow-700 focus:bg-yellow-700 active:scale-100" : ""}
          ${className}`}
    onClick={onClick}
    >{children}</button>
  )
}

export default ActionButton