import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GiCrafting } from "react-icons/gi";
import { GiHut } from "react-icons/gi";
import { FaWrench } from "react-icons/fa";

const roomIcons = {
    GiCrafting: <GiCrafting />,
    GiHut: <GiHut />,
    FaWrench: <FaWrench />,
};
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const RoomList = ({ currentChatRoom, setCurrentChatRoom }) => {
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        const fetchChatGroups = async () => {
            try {
                const response = await axios.get(`${VITE_BASE_URL}/chat/rooms`)
                // console.log("response : ", response)
                setRooms(response.data);
            } catch (e) {
                console.log("Error fetching chat groups ", e)
            }
        }

        fetchChatGroups()
    }, []);

    return (
        <div className="flex text-white flex-col items-start min-h-[90vh] bg-richblack-900 rounded-lg p-5 min-w-[250px]">
            <h1 className="text-xl font-bold">Public Chat Groups</h1>
            <ul className="flex flex-col gap-y-1 w-full py-5">
                {rooms.map((room) => {
                    return (
                        <span
                            key={room?._id}
                            onClick={() => setCurrentChatRoom(room)} className={`${currentChatRoom?.name === room.name ? "text-yellow-100" : ""} mt-1 cursor-pointer flex items-center gap-2`}
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
