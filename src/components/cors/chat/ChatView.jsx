import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux';
import { IoSendSharp } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";

const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const ChatView = ({ socket, currentChatRoom, setCurrentChatRoom }) => {
    const { user } = useSelector((state) => state.profile);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const navigate = useNavigate();
    const containerRef = useRef(null)

    useEffect(() => {
        const fetchChathistory = async () => {

            if (!currentChatRoom) return

            try {
                const response = await axios.get(`${VITE_BASE_URL}/chat/messages/${currentChatRoom?._id}`)
                console.log("response : ", response)
                setMessages(response.data.reverse());
            } catch (e) {
                console.log("Error fetching chat history ", e)
            }
        }

        fetchChathistory()
    }, [currentChatRoom]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages])

    // Join room and listen for new messages
    useEffect(() => {
        socket.connect();

        if (currentChatRoom) {
            socket.emit("joinGroup", currentChatRoom?._id);

            socket.on("receiveMessage", (message) => {
                setMessages((prev) => [...prev, message]);
            });
        }

        return () => {
            socket.off("receiveMessage");
            socket.disconnect();
        };
    }, [currentChatRoom]);

    // Send message
    const sendMessage = () => {
        if (!user) {
            navigate("/login")
            toast.error('please login...')
        }

        if (newMessage.trim() === "") return;

        const messageData = {
            sender: user?._id,
            content: newMessage,
            roomId: currentChatRoom?._id
        };
        socket.emit("sendMessage", messageData);
        setNewMessage("");
    };

    if (!currentChatRoom) {
        return (
            <div className='col-span-2 bg-richblack-800 w-full'></div>
        )
    }

    return (
        <div ref={containerRef} className='col-span-2 bg-diagonal-stripes w-full h-[90vh]  overflow-y-auto'>
            <div className="w-full mx-auto flex-grow flex flex-col items-start relative ">
                <div className='max-w-[1000px] min-h-[90vh] w-full mx-auto flex flex-col items-start px-4 py-2 gap-y-2'>
                    {messages.map((msg, index) => (
                        <Message user={user} key={index} message={msg} />
                    ))}
                </div>
                <div className="sticky left-0 bottom-0 w-full flex">
                    <input
                        type="text"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                sendMessage();
                            }
                        }}
                        value={newMessage}
                        className="py-2 px-3 w-full outline-none shadow-sm border-none text-richblack-25 bg-richblack-700 "
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button
                        className="bg-yellow-100 text-richblack-900 px-4 py-2"
                        onClick={sendMessage}
                    >
                        <IoSendSharp />
                    </button>
                </div>
            </div>
        </div>
    )
}

const Message = ({ message, user }) => {
    const time = new Date(message?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`flex items-start gap-3 ${user?._id === message?.sender?._id ? "self-end flex-row-reverse" : ""}`}>
            <span>
                <img src={message?.sender?.image} className='w-6 h-6 rounded-full border border-richblack-200' alt="user" />
            </span>
            <div className='bg-richblack-50 min-w-[150px] px-2 py-1 rounded-lg text-richblack-900'>
                <p className='text-xs font-light'>{message?.sender?.firstName + " " + message?.sender?.lastName}</p>
                <p className='text-base mb-1 font-semibold'>{message.content}</p>
                <p className='text-xs text-end text-richblack-700'>{time}</p>
            </div>
        </div>
    )
}

export default ChatView