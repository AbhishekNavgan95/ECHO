import React, { useEffect } from "react";
import ActionButton from "./ActionButton";
import ScrollLock from "../../hooks/ScrollLock";

const Modal = ({ modalData }) => {
  document.body.style.overflowY = "hidden"

  return (
    <>
    <div onClick={modalData?.btn2Handler} className="w-full h-full bg-opec backdrop-blur-sm fixed grid place-items-center top-0 left-0 z-[10]">
      <div className="text-richblack-5 w-max bg-richblack-800 min-w-[300px] md:min-w-[400px] rounded-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col py-8 px-8 items-center gap-y-7">
          <div className="flex flex-col gap-2 items-center">
            <h3 className="text-xl font-semibold text-center">{modalData?.heading}</h3>
            <p className="text-sm text-richblack-300 text-center">
              {modalData?.subHeading}
            </p>
          </div>
          <div className="flex gap-x-5">
            <ActionButton
              active
              onClick={modalData.btn1Handler}
            >
              {modalData.btn1Text}
            </ActionButton>
            <ActionButton
              onClick={modalData?.btn2Handler}
            >
              {modalData?.btn2Text}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
    <ScrollLock />
    </>
  );
};

export default Modal;
