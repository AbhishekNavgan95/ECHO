import React, { useEffect } from "react";
import ActionButton from "./ActionButton";
import ScrollLock from "../../hooks/ScrollLock";

const Modal = ({ modalData }) => {
  document.body.style.overflowY = "hidden"

  return (
    <>
    <div onClick={modalData?.btn2Handler} className="w-full h-full bg-opec fixed top-0 left-0 z-[10]">
      <div className="text-richblack-5  absolute bg-richblack-800 top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%] rounded-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col py-10 px-14 items-center gap-5">
          <div className="flex flex-col gap-2 items-center">
            <h3 className="text-2xl ">{modalData?.heading}</h3>
            <p className="text-lg text-richblack-300">
              {modalData?.subHeading}
            </p>
          </div>
          <div className="flex gap-10">
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
