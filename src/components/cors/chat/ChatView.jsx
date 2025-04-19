import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { IoSendSharp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import RoomList from "./RoomList";
import { useSocket } from "@/contexts/SocketContext";

const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const ChatView = () => {
  const { socket } = useSocket();
  const { user } = useSelector((state) => state.profile);
  const [currentChatRoom, setCurrentChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Fetch chat history on room change
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!currentChatRoom) return;

      try {
        const { data } = await axios.get(
          `${VITE_BASE_URL}/chat/messages/${currentChatRoom._id}`
        );
        setMessages(data.reverse());
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    fetchChatHistory();
  }, [currentChatRoom]);

  // Auto scroll to latest message
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Join room and listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    socket.connect();
    console.log("socket : ", socket);

    if (currentChatRoom) {
      socket.emit("joinGroup", currentChatRoom._id);

      const handleMessageReceive = (message) => {
        setMessages((prev) => [...prev, message]);
      };

      socket.on("receiveMessage", handleMessageReceive);

      return () => {
        socket.off("receiveMessage", handleMessageReceive);
      };
    }
  }, [socket, currentChatRoom]);

  const sendMessage = () => {
    if (!user) {
      navigate("/login");
      toast.error("Please login to send messages.");
      return;
    }

    if (!newMessage.trim()) return;

    const messageData = {
      sender: user._id,
      content: newMessage,
      roomId: currentChatRoom._id,
    };
    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  return (
    <section className="flex">
      <RoomList
        currentChatRoom={currentChatRoom}
        setCurrentChatRoom={setCurrentChatRoom}
      />

      <div
        ref={containerRef}
        className="col-span-2 bg-diagonal-stripes w-full h-[90vh] overflow-y-auto"
      >
        <div className="w-full mx-auto flex-grow flex flex-col items-start relative">
          <div className="max-w-[1000px] min-h-[90vh] w-full mx-auto flex flex-col justify-end items-start px-2 md:px-4 py-2 gap-y-2">
            {messages.map((msg, index) => (
              <Message user={user} key={index} message={msg} />
            ))}
          </div>

          <div className="sticky left-0 bottom-0 w-full flex">
            <input
              type="text"
              value={newMessage}
              placeholder="Type a message..."
              className="py-2 px-3 w-full outline-none shadow-sm border-none text-richblack-25 bg-richblack-700"
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
    </section>
  );
};

const Message = ({ message, user }) => {
  const isOwnMessage = user?._id === message?.sender?._id;
  const time = new Date(message?.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex items-start gap-2 md:gap-3 ${isOwnMessage ? "self-end flex-row-reverse" : ""
        }`}
    >
      <span>
        <img
          src={message?.sender?.image}
          alt="user"
          className="w-6 h-6 rounded-full border border-richblack-200"
        />
      </span>
      <div className="bg-richblack-50 min-w-[150px] px-2 py-1 rounded-lg text-richblack-900">
        <p className="text-[10px] md:text-xs font-light">
          {message?.sender?.firstName} {message?.sender?.lastName}
        </p>
        <p className="text-sm md:text-base mb-1 font-semibold">
          {message.content}
        </p>
        <p className="text-[10px] md:text-xs text-end text-richblack-700">
          {time}
        </p>
      </div>
    </div>
  );
};

export default ChatView;
