import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("send_message", async ({ conversationId, text, imageUrl }) => {
      try {
        // A message needs at least text OR an image — reject if both are empty
        const hasText = text && text.trim();
        const hasImage = imageUrl && imageUrl.length > 0;
        if (!hasText && !hasImage) return;

        // Basic size guard — a base64 image string over ~3MB is rejected,
        // even though the frontend also checks this before sending.
        // Never trust size limits enforced only on the client.
        if (hasImage && imageUrl.length > 3_000_000) {
          socket.emit("message_error", "Image too large.");
          return;
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text: hasText ? text.trim() : "",
          imageUrl: hasImage ? imageUrl : "",
        });

        await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

        const populatedMessage = await message.populate("sender", "name");

        io.to(conversationId).emit("receive_message", populatedMessage);
      } catch (err) {
        console.error("Failed to send message:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
}