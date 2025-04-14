import React, { useState } from "react";
import { sidebarLinks } from "../../../data/dashboard-links";
import { logout } from "../../../services/operations/authAPI";
import { useDispatch, useSelector } from "react-redux";
import SidebarLink from "./sidebar/SidebarLink";
import { useNavigate } from "react-router-dom";
import { GrLogout } from "react-icons/gr";
import Modal from "../../common/Modal";
import DangerButton from "../../common/DangerButton"

const Sidebar = () => {
  const { user, loading: userLoading } = useSelector((state) => state.profile);
  const { loading: authLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [modal, setModal] = useState({
    isOpen: false,
  });

  if (userLoading || authLoading) {
    return <div className="bg-yellow-25 text-4xl">Loading...</div>;
  }

  return (
    <>
      <div
        className= "w-full max-w-maxContent mx-auto py-3 px-5 h-max z-[2] text-richblack-5 bg-richblack-800 ">
        <div className="md:flex justify-between items-center md:flex-row">
          <div className="flex md:flex-row justify-center md:justify-between ">
            {sidebarLinks.map((link, index) => {
              if (link.type && user?.accountType === link.type || link.type === undefined) {
                return <SidebarLink key={index} link={link} />;
              }
              if (link.path === "settings") {
                return <SidebarLink key={index} link={link} />;
              }
            })}
          </div>
          <div className="hidden md:flex flex-col items-center gap-1">
            <DangerButton
              action={() =>
                setModal({
                  heading: "Are you sure?",
                  subHeading: "You'll be logged out",
                  btn1Text: "Log out",
                  btn2Text: "Cancel",
                  isOpen: true,
                  btn1Handler: () => dispatch(logout(navigate)),
                  btn2Handler: () => setModal({ isOpen: false }),
                })
              }
              active
            >
              <GrLogout />
              Logout
            </DangerButton>
          </div>
        </div>
      </div>
      {modal.isOpen === true ? <Modal modalData={modal} /> : null}
    </>
  );
};

export default Sidebar;
