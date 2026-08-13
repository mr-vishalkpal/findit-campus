import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // The item this conversation started from.
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    // Set ONLY when this conversation came from a confirmed match —
    // links the second (opposite lost/found) item, so the chat can
    // show and link to BOTH sides of the match.
    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },
    reads: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        lastReadAt: { type: Date, default: null },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;