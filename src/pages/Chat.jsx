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
            <div className="flex px-2 md:px-0">
                <RoomList currentChatRoom={currentChatRoom} setCurrentChatRoom={setCurrentChatRoom} />
                <ChatView socket={socket} currentChatRoom={currentChatRoom} setCurrentChatRoom={setCurrentChatRoom}  />
            </div>
        </div>
    );
};

export default Chat;

{/* <h1 className="text-2xl font-bold my-4">💬 Chat Room: {roomId}</h1>

            <div className="bg-gray-800 w-full max-w-xl min-h-[60vh] p-4 rounded-lg overflow-y-auto">
                {loading ? (
                    <p>⏳ Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p>No messages yet. Start the conversation!</p>
                ) : (
                    messages.map((msg, index) => (
                        <p key={index} className="text-sm">
                            <strong>{msg.sender}:</strong> {msg.content}
                        </p>
                    ))
                )}
            </div>

            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    className="py-2 px-3 border border-gray-400 rounded-lg w-64 text-richblack-800"
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button
                    className="bg-yellow-400 text-black px-4 py-2 rounded-lg"
                    onClick={sendMessage}
                >
                    Send
                </button>
            </div> */}