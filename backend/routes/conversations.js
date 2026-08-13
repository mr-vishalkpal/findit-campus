import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", async (req, res) => {
  try {
    const { itemId, otherUserId } = req.body;

    if (!itemId || !otherUserId) {
      return res.status(400).json({ error: "itemId and otherUserId are required" });
    }
    if (otherUserId === req.userId) {
      return res.status(400).json({ error: "You can't start a conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      item: itemId,
      participants: { $all: [req.userId, otherUserId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        item: itemId,
        participants: [req.userId, otherUserId],
      });
    }

    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Failed to start conversation" });
  }
});

// GET /api/conversations — inbox list, now with an unread count and
// item hint (title + lost/found) attached to each conversation.
router.get("/", async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.userId })
      .populate("participants", "name")
      .populate("item", "title type")
      .populate("relatedItem", "title type")
      .sort({ updatedAt: -1 });

    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const myRead = conv.reads.find((r) => r.user.toString() === req.userId);
        const since = myRead?.lastReadAt || conv.createdAt;

        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.userId },
          createdAt: { $gt: since },
        });

        // Total messages ever sent in this conversation — used below
        // to hide "empty" conversations (started but never actually
        // messaged in) from the inbox list.
        const totalMessages = await Message.countDocuments({ conversation: conv._id });

        return { ...conv.toObject(), unreadCount, totalMessages };
      })
    );

    // Only show conversations where at least one message has been
    // sent. Clicking "Message Poster" creates the conversation
    // immediately (so the chat window has somewhere to open), but it
    // shouldn't clutter the inbox until an actual message exists.
    const nonEmpty = withUnread.filter((conv) => conv.totalMessages > 0);

    res.json(nonEmpty);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// GET /api/conversations/:id — single conversation's details (used to
// show "About: Lost watch" at the top of the chat window)
router.get("/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("participants", "name")
      .populate("item", "title type")
      .populate("relatedItem", "title type");

    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.participants.some((p) => p._id.toString() === req.userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

router.get("/:id/messages", async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.participants.some((p) => p.toString() === req.userId)) {
      return res.status(403).json({ error: "Not authorized to view this conversation" });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/conversations/:id/read — mark this conversation as read
// (called when the user opens the chat, or receives a message while
// already inside it)
router.post("/:id/read", async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.participants.some((p) => p.toString() === req.userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const existingRead = conversation.reads.find((r) => r.user.toString() === req.userId);
    if (existingRead) {
      existingRead.lastReadAt = new Date();
    } else {
      conversation.reads.push({ user: req.userId, lastReadAt: new Date() });
    }

    await conversation.save();
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

export default router;