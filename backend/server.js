// server.js
//
// This is the entry point of the backend. Running "node server.js"
// starts an Express web server that listens for HTTP requests.

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";
import itemsRouter from "./routes/items.js";

dotenv.config(); // loads variables from .env into process.env

dns.setServers(["1.1.1.1", "8.8.8.8"]);
// Forces Node to use Cloudflare and Google's public DNS for lookups,
// bypassing your network/ISP's default resolver — which is what was
// blocking the mongodb+srv:// SRV record lookup.

const app = express();

// ---- Middleware ----
// Middleware = functions that run on EVERY request before it reaches
// your route handlers.

app.use(cors());
// cors() allows your React app (running on a different port/domain)
// to make requests to this server. Without it, the browser blocks
// the request for security reasons (Cross-Origin Resource Sharing).

app.use(express.json());
// This lets Express understand JSON in the request body — e.g. when
// React sends { title: "Lost wallet", ... }, this parses it into
// req.body so we can use it in our routes.

// ---- Routes ----
app.get("/", (req, res) => {
  res.send("Lost & Found API is running.");
});

app.use("/api/items", itemsRouter);
// Any request to /api/items or /api/items/something gets handed off
// to itemsRouter (routes/items.js), which decides what to do with it.

// ---- Connect to MongoDB, then start the server ----
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });