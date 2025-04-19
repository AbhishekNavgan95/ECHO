// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const SocketContext = createContext();

const VITE_BASE_URL = import.meta.env.VITE_SOCKET_BASE_URL;

// singleton socket instance
export const socket = io(VITE_BASE_URL);

export const SocketProvider = ({ children }) => {
  const { user } = useSelector((state) => state.profile);

  useEffect(() => {
    if (user?._id) {
      socket.connect();
      console.log("✅ Socket connected");

      return () => {
        socket.disconnect();
        console.log("❌ Socket disconnected");
      };
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// custom hook for consuming socket
export const useSocket = () => useContext(SocketContext);
