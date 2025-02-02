const express = require("express");
const app = express();
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

// Import routes
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payment");
const courseRoutes = require("./routes/Course");
const chatRoutes = require("./routes/Chat");
const { contactUs } = require("./controllers/ContactUs");
const { getMessageHistory } = require("./controllers/Message");

// Import DB config
const database = require("./config/databse");
const { cloudinaryConnect } = require("./config/cloudinary");
const Message = require("./models/Message");

// Initialize Server
const PORT = process.env.PORT || 4000;
const server = http.createServer(app); // Create HTTP Server for Socket.io

// Connect to Database
database.connectToDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "https://echo-an.netlify.app/",
    credentials: true,
    maxAge: 14400,
  })
);
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Connect to Cloudinary
cloudinaryConnect();

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "https://echo-an.netlify.app",
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinGroup", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined group ${roomId}`);
  });

  socket.on("sendMessage", async (data) => {

    const newMessage = new Message(data);
    await newMessage.save();
    const message = await Message.findById(newMessage._id).populate("sender");

    io.to(data?.roomId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.use("/api/v1/contact", contactUs);
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Your server is up and running...",
  });
});

// Start the Server
server.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
