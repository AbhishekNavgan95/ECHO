import { useRef, useState } from "react";
import { AiOutlineCaretDown } from "react-icons/ai";
import { VscDashboard, VscSignOut } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setProgress } from "../../../slices/loadingBarSlice";

// import useOnClickOutside from "../../../hooks/useOnClickOutside"
import { logout } from "../../../services/operations/authAPI";

export default function ProfileDropdown() {
  const { user } = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // useOnClickOutside(ref, () => setOpen(false))

  if (!user) {
    return localStorage.setItem("token", null);
  }

  return (
    <button
      className="relative rounded-full "
      onClick={() => {
        setOpen(!open);
      }}
    >
      <div className="flex items-center gap-x-1">
        <img
          loading="lazy"
          src={user?.image}
          alt={`profile-${user?.firstName}`}
          className="aspect-square w-[30px] rounded-full object-cover"
        />
        <AiOutlineCaretDown className={`text-sm text-richblack-100 transition-all duration-300 ${open ? "rotate-180" : "rotate-0"}`} />
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          dispatch(setProgress(100))
        }}
        className={`absolute left-[50%] top-[150%] translate-x-[-50%] z-[11] overflow-hidden rounded-md border border-richblack-600 bg-richblack-800 transition-all duration-100 ${!open ? "invisible opacity-0" : "visible opacity-100"}`}
        ref={ref}
      >
        <Link to="/dashboard/my-profile" onClick={() => setOpen(false)}>
          <div className="flex w-full items-center gap-x-1 py-[10px] px-[12px] text-sm text-richblack-5 hover:bg-richblack-700 tramsition-all duration-300 hover:text-richblack-25">
            <VscDashboard className="text-lg" />
            Dashboard
          </div>
        </Link>
      </div>
    </button>
  );
}
