import React, { useEffect, useRef, useState } from "react";
import logo from "../../assets/Logo/logo.png";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { NavbarLinks } from "../../data/navbar-links";
import { useDispatch, useSelector } from "react-redux";
import { FiShoppingBag } from "react-icons/fi";
import ProfileDropdown from "../../components/cors/Auth/ProfileDropDown";
import CtaButton from "./CtaButton";
import { categories, courseEndpoints } from "../../services/apis";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { apiConnector } from "../../services/apiconnector";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import Modal from "./Modal";
import { logout } from "../../services/operations/authAPI";
import { IoClose } from "react-icons/io5";
import { ACCOUNT_TYPE } from "../../utils/constants";
import { setProgress } from "../../slices/loadingBarSlice";
import { IoCloseSharp } from "react-icons/io5";
import { FaSearch } from "react-icons/fa";
import { GoDash } from "react-icons/go";
import DangerButton from "../common/DangerButton"
import ScrollLock from "../../hooks/ScrollLock";
import { setCategory } from "../../slices/categorySlice";


const Navbar = () => {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.profile.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const totalItems = useSelector((state) => state.cart.totalItems);
  const [subLinks, setSubLinks] = useState([]);
  const [navOpen, setNavOpen] = useState(false); 1
  const [subNav, setSubNav] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [coursesFound, setCoursesFound] = useState([]);
  const searchBarRef = useRef(null);


  const fetchSublinks = async () => {
    try {
      const result = await apiConnector("GET", categories.CATEGORIES_API);
      setSubLinks(result?.data?.data);
      dispatch(setCategory(result?.data?.data))
    } catch (e) {
      console.log("could not fetch categories : ", e);
    }
  };

  const setSearchBarActive = () => {
    if (searchActive) {
      setCoursesFound([])
      setSearchVal("");
    }
  }

  const handleSearchQueryChange = (e) => {
    setSearchVal(e.target.value);
  }

  useEffect(() => {
    if (searchVal) {
      const id = setTimeout(async () => {

        try {
          const res = await apiConnector("POST", courseEndpoints.SEARCH_COURSE, { searchParam: searchVal });
          setCoursesFound(res?.data?.data);
        } catch (e) {
          console.log("error : ", e);
        }
      }, 500);

      return () => {
        clearTimeout(id)
      }
    } else {
      setCoursesFound([]);
      setSearchBarActive();
    }
  }, [searchVal])

  useEffect(() => {
    fetchSublinks();
  }, []);

  return (
    <>
      <div className="relative">
        <div className="border-b border-richblack-600 bg-richblack-900 py-5 relative z-[10]">
          <div className="flex max-w-maxContent mx-auto justify-between px-5 items-center relative z-[10]">
            {/* logo */}

            <Link to={"/"} onClick={() => dispatch(setProgress(100))} className="">
              <img className="max-w-[5rem]"  loading="lazy"  src={logo} alt="logo" />
            </Link>

            {/* nav links*/}
            <div className="md:flex font-semibold text-lg items-center justify-center gap-5 hidden">
              {NavbarLinks.map((link, index) => {
                return (
                  <NavLink
                    onClick={() => dispatch(setProgress(100))}
                    className={({ isActive }) =>
                      isActive ? "text-yellow-100" : "text-richblack-25"
                    }
                    key={index}
                    to={link?.path}
                  >
                    <p>{link.title}</p>
                  </NavLink>
                );
              })}
              <button onClick={() => {
                setSearchActive(true)
                searchBarRef?.current?.focus();
              }} className="text-richblack-5 text-lg flex items-center justify-center px-2 py-1">
                <FaSearch />
              </button>
            </div>

            {/* Login / signup / dashboard */}
            <div className="md:flex items-center gap-3 text-richblack-25 text-xl hidden">
              {token === null && (
                <CtaButton active="true" linkTo={"/login"}>
                  Log in
                </CtaButton>
              )}
              {token === null && (
                <CtaButton active={false} linkTo={"/signup"}>
                  Sign up
                </CtaButton>
              )}
              {token !== null && <ProfileDropdown />}
              {user && user?.accountType === ACCOUNT_TYPE.STUDENT && (
                <Link to="/dashboard/cart" onClick={() => dispatch(setProgress(100))} className="relative px-2 py-1">
                  <FiShoppingBag />
                  {totalItems > 0 && <span className="absolute top-[-5px] right-0 aspect-square flex items-center text-xs font-bold bg-yellow-100 rounded-full px-2 text-richblack-900">{totalItems}</span>}
                </Link>
              )}
            </div>

            <div className="flex gap-3 items-center md:hidden">
              {/* mobile nav search button */}
              <button onClick={() => {
                setSearchActive(true)
                setNavOpen(false);
                setSubNav(false)
                searchBarRef?.current?.focus();
              }} className="text-richblack-5 text-lg ">
                <FaSearch />
              </button>
              {/* nav button */}
              <div className="md:hidden items-center cursor-pointer text-richblack-5 text-3xl" onClick={() => { setNavOpen(!navOpen); setSubNav(false) }}>
                {
                  !navOpen
                    ? <HiOutlineMenuAlt3 />
                    : <IoClose />
                }
              </div>
            </div>

          </div>

          {/* mobile navbar */}
          <div className={`bg-opec z-[7] w-full h-[100vh] fixed transition-all duration-100 top-0 ${navOpen ? "visible opacity-100" : "invisible opacity-0"}`} onClick={() => setNavOpen(!navOpen)}>
            <div className={`absolute w-full h-full md:hidden top-0 border-richblack-600 flex flex-col gap-5 items-center justify-center py-20 text-xl`}>
              {NavbarLinks.map((link, index) => {
                return link.title === "Catalog" ? (
                  <button
                    className={`text-richblack-5 w-full hover:cursor-pointer flex flex-col items-center gap-4 ${location?.pathname?.includes("catalog") ? "text-yellow-100" : "text-richblack-5"}`}
                    key={index}
                    onClick={() => setSubNav(!subNav)}
                  >
                    <div className={
                      ` text-lg flex flex-col gap-5`
                    }
                    >
                      {
                        subLinks?.length <= 0 ?
                          <div className="py-1">No categories found</div>
                          :
                          subLinks?.map((category, index) => (
                            <NavLink
                              to={`/catalog/${category.name}`}
                              className={`text-richblack-5${location?.pathname?.includes(category.name.replaceAll(" ", "%20")) ? "bg-richblack-800" : ""}`}
                              key={index}
                              onClick={() => { setNavOpen(!navOpen); setSubNav(false) }}
                            >
                              <p className="">{category.name}</p>
                            </NavLink>
                          ))}
                    </div>
                  </button>
                ) : (
                  <NavLink
                    className={({ isActive }) =>
                      isActive ? "text-yellow-100" : "text-richblack-25"
                    }
                    key={index}
                    to={link?.path}
                    onClick={() => { setNavOpen(false); dispatch(setProgress(100)) }}
                  >
                    <p>{link.title}</p>
                  </NavLink>
                );
              })}
              <div className="flex items-center gap-5 gap-y-5">
                {
                  token &&
                  <CtaButton
                    active='true'
                    linkTo={"/dashboard/my-profile"}
                    onClick={() => {
                      setNavOpen(!navOpen);
                      dispatch(setProgress(100))
                    }}
                    className={({ isActive }) =>
                      isActive ? "text-yellow-100" : "text-richblack-25"
                    }
                  >
                    Dashboard
                  </CtaButton>
                }
                {
                  token &&
                  <DangerButton
                    action={() => setConfirmationModal({
                      heading: "Are you sure?",
                      subHeading: "You'll be logged out",
                      btn1Text: "Log out",
                      btn2Text: "Cancel",
                      btn1Handler: () => dispatch(logout(navigate)),
                      btn2Handler: () => setConfirmationModal(null),
                    })}
                  >
                    Log out
                  </DangerButton>
                }
                <div className="flex gap-5">
                  {token === null && (
                    <button onClick={() => {
                      setNavOpen(!navOpen)
                    }}>
                      <CtaButton active="true" linkTo={"/login"}>
                        Log in
                      </CtaButton>
                    </button>
                  )}
                  {token === null && (
                    <button onClick={() => {
                      setNavOpen(!navOpen)
                    }}>
                      <CtaButton active={false} linkTo={"/signup"}>
                        Sign up
                      </CtaButton>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {
            navOpen &&
            <ScrollLock />
          }
        </div>

        {/* search bar */}
        <div className={`w-full h-screen bg-opec top-0 z-[12] fixed transition-all duration-100 ${searchActive ? "visible opacity-100" : "invisible opacity-0"}`} onClick={() => { setSearchActive(false); setSearchBarActive() }}>
          <div className={`bg-richblack-900 py-3 md:py-5 fixed w-full top-0 z-[10] transition-all border-b border-richblack-600 duration-100`} onClick={(e) => e.stopPropagation()}>
            {/* input */}
            <div className={`max-w-maxContent relative inset-0 z-[11] text-richblack-300 flex flex-col gap-3 mx-auto w-full`}>
              <div className="flex items-center justify-between w-full gap-5 px-3">
                <div className="w-full">
                  <input
                    type="text"
                    ref={searchBarRef}
                    className="w-full py-2 bg-richblack-900 outline-none text-richblack-5 text-xl"
                    name=""
                    value={searchVal}
                    onChange={(e) => handleSearchQueryChange(e)}
                    id=""
                    placeholder="Search"
                  />
                </div>
                <button onClick={() => {
                  setSearchBarActive()
                  setSearchActive(!searchActive);
                }} className="text-3xl text-richblack-5">
                  <IoCloseSharp />
                </button>
              </div>
            </div>

            {/* output courses */}
            <div className="text-richblack-900 text-lg absolute w-full top-[100%]">
              <div className="max-w-maxContent mx-auto text-richblack-5 flex flex-col text-xl py-2">
                {
                  coursesFound.length > 0 &&
                  coursesFound.map((course) => (
                    <Link
                      to={`courses/${course?._id}`}
                      tabIndex="0"
                      className="transition-all focus:text-yellow-200 duration-300 px-3 outline-none flex items-start gap-3 hover:gap-5 focus:gap-5 hover:text-yellow-200 py-2"
                      onClick={() => {
                        setSearchBarActive();
                        setSearchActive(false);
                      }} key={course?._id}
                    >
                      <GoDash className="translate-y-[5px]" />
                      <p className="">{course?.courseTitle}</p>
                    </Link>))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        confirmationModal && <Modal modalData={confirmationModal} />
      }
      {
        searchActive && <ScrollLock />
      }
    </>
  );
};

export default Navbar;
