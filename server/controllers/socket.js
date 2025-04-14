const CodingRoom = require("../models/CodingRoom");
const Message = require("../models/Message");

const listenToSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket ID: ", socket.id);

    // message events
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

    // codespace events
    socket.on("joinCodingRoom", async ({ roomId, userId }) => {
      console.log("joined coding room : ", roomId)
      console.log("joined userId : ", userId)
      const codingRoom = await CodingRoom.findById(roomId);
      if (!codingRoom) return; 

      const isParticipant = codingRoom.participants.some(
        (p) => p.user.toString() === userId
      );
      if (!isParticipant && isParticipant._id !== codingRoom?.instructor?._id) {
        codingRoom.participants.push({ user: userId });
        await codingRoom.save();
      }

      socket.join(roomId);
      io.to(roomId).emit("userJoined", { userId });
    });

    socket.on(
      "sendMessageToCodingRoom",
      async ({ roomId, senderId, content }) => {
        try {
          const codingRoom = await CodingRoom.findById(roomId);
          if (!codingRoom) return;

          const participant = codingRoom.participants.find(
            (p) => p.user.toString() === senderId
          );
          if (!participant) return; // Only allow room participants to chat

          if (participant.mutedUntil) {
            const now = new Date();
            if (now < participant.mutedUntil) {
              socket.emit(
                "chatError",
                "You are muted until " + participant.mutedUntil
              );
              return;
            }
          }

          codingRoom.chatMessages.push({ sender: senderId, content });
          await codingRoom.save();

          // Broadcast message to all in the room
          io.to(roomId).emit("receiveMessage", { sender: senderId, content });
        } catch (error) {
          console.error("Error sending message:", error);
        }
      }
    );

    socket.on("kickUser", async ({ roomId, userId }) => {
      const room = await CodingRoom.findById(roomId);
      if (!room || room.instructor.toString() !== userId) return;

      room.participants = room.participants.filter(
        (p) => p.user.toString() !== userId
      );
      await room.save();

      io.to(roomId).emit("userKicked", { userId });
    });

    socket.on("updateCode", async ({ roomId, userId, code }) => {
      try {
        const codingRoom = await CodingRoom.findById(roomId);
        if (!codingRoom) return;

        const participant = codingRoom.participants.find(
          (p) => p.user.toString() === userId
        );
        if (
          !participant ||
          participant.role !== "editor" ||
          userId !== codingRoom?.instructor?._id
        ) {
          socket.emit(
            "codeUpdateError",
            "You don't have permission to edit the code."
          );
          return;
        }

        // Update code in DB and broadcast changes
        codingRoom.codeContent = code;
        await codingRoom.save();

        io.to(roomId).emit("codeUpdated", { userId, code });
      } catch (error) {
        console.error("Error updating code:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = listenToSocketEvents;
