import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GiCrafting } from "react-icons/gi";
import { GiHut } from "react-icons/gi";
import { FaWrench } from "react-icons/fa";
import { LuChevronsLeft } from "react-icons/lu";
import { IoMdArrowBack } from "react-icons/io";

const roomIcons = {
    GiCrafting: <GiCrafting />,
    GiHut: <GiHut />,
    FaWrench: <FaWrench />,
};
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const RoomList = ({ currentChatRoom, setCurrentChatRoom }) => {
    const [rooms, setRooms] = useState([]);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChatGroups = async () => {
            try {
                const response = await axios.get(`${VITE_BASE_URL}/chat/rooms`)
                setRooms(response.data);
            } catch (e) {
                console.log("Error fetching chat groups ", e)
            }
        }

        fetchChatGroups()
    }, []);

    return (
        <div className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-all duration-300 absolute lg:static top-[4.46rem] z-[2] left-0 flex text-white flex-col items-center min-h-[90vh] bg-richblack-900 p-1 min-w-[250px]`}>
            <button onClick={() => setOpen(prev => !prev)} className={`${!open ? "rotate-180" : "rotate-0"} lg:hidden absolute top-2 p-2 bg-yellow-200 text-richblack-800 text-xl right-[-35px] outline-none`}><LuChevronsLeft /></button>
            <ul className="flex flex-col gap-y-2 w-full py-5">
                <button className='flex w-full items-center  gap-2 transition-all duration-300 py-1 hover:text-yellow-200  px-4' onClick={() => navigate(-1)}><IoMdArrowBack className="" /> Back</button>
                {rooms.map((room) => {
                    return (
                        <span
                            key={room?._id}
                            onClick={() => setCurrentChatRoom(room)} className={`${currentChatRoom?.name === room.name ? "bg-yellow-100 text-richblack-900" : ""} py-1 px-4 mt-1 cursor-pointer flex items-center gap-2`}
                        >
                            {roomIcons[room.icon]}
                            {room.name}
                        </span>
                    )
                })}
            </ul>
        </div>
    );
};

export default RoomList;
