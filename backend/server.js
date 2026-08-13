import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";
import { createServer } from "http";
import itemsRouter from "./routes/items.js";
import authRouter from "./routes/auth.js";
import conversationsRouter from "./routes/conversations.js";
import { setupSocket } from "./socket.js";

dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FindIt Campus API is running.");
});

app.use("/api/items", itemsRouter);
app.use("/api/auth", authRouter);
app.use("/api/conversations", conversationsRouter);

const httpServer = createServer(app);
setupSocket(httpServer);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });