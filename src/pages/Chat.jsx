import React, { useEffect, useReducer, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useSelector } from "react-redux";
import RoomList from "../components/cors/chat/RoomList";
import HighlightText from "../components/common/HighlightText";
import ChatView from "../components/cors/chat/ChatView";

const SERVER_URL = import.meta.env.VITE_SERVER_URI

const socket = io(SERVER_URL, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: true,
});

const Chat = () => {
    const [currentChatRoom, setCurrentChatRoom] = useState(null)

    return (
        <div className="mx-auto text-richblack-25">
            <div className="flex px-3 md:px-0">
                <RoomList currentChatRoom={currentChatRoom} setCurrentChatRoom={setCurrentChatRoom} />
                <ChatView socket={socket} currentChatRoom={currentChatRoom} setCurrentChatRoom={setCurrentChatRoom} />
                <ChatRules />
            </div>
        </div>
    );
};

const ChatRules = () => {
    return (
        <div className="bg-richblack-800 min-h-full hidden xl:flex right-0 border-l border-richblack-600 lg:static flex-col items-start gap-2 min-w-[300px] px-5 py-5">
            <h1 className="text-2xl font-semibold">Chat Rules</h1>
            <div className="flex flex-col gap-2">
                <p>No Spamming or flooding the chat</p>
                <p>Be respectful to all members</p>
                <p>Use appropriate language - no profanity</p>
                <p>No hate speech or discriminatory comments</p>
                <p>Don't share personal information</p>
                <p>No advertising or self-promotion</p>
                <p>Stay on topic in discussions</p>
                <p>No impersonating other users</p>
                <p>No sharing of illegal content</p>
                <p>No political discussions</p>
                <p>Use appropriate usernames</p>
                <p>Report any violations to moderators</p>
                <p>No sharing of NSFW content</p>
                <p>Keep conversations family-friendly</p>
                <p>No harassment or bullying</p>
            </div>
        </div>
    )
}

export default Chat;