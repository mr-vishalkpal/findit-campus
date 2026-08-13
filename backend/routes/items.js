import express from "express";
import Item from "../models/Item.js";
import Conversation from "../models/Conversation.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// GET /api/items — public browse. Always excludes archived items.
router.get("/", async (req, res) => {
  try {
    const { type, search, resolved } = req.query;
    const filter = { archived: false };

    if (type) filter.type = type;
    if (resolved !== undefined) filter.resolved = resolved === "true";

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Item.find(filter).sort({ createdAt: -1 }).populate("postedBy", "name");
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// GET /api/items/mine — everything I've posted, INCLUDING archived ones.
// Must be defined BEFORE "/:id" below, otherwise Express would think
// "mine" is an :id value.
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const items = await Item.find({ postedBy: req.userId })
      .sort({ createdAt: -1 })
      .populate("postedBy", "name");
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch your posts" });
  }
});

// GET /api/items/:id/matches — for one of MY items, find opposite-type
// (lost <-> found) items posted by OTHER people that share keywords.
router.get("/:id/matches", requireAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.postedBy.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const oppositeType = item.type === "lost" ? "found" : "lost";

    // Very simple keyword extraction: split title+description into
    // words, drop short/common ones, dedupe. This is not fancy NLP —
    // just enough to catch "watch" matching "watch" between posts.
    const stopwords = ["with", "near", "the", "and", "that", "this", "have", "from", "been", "were", "has", "had", "was", "for", "are", "not"];
    const words = (item.title + " " + item.description)
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && !stopwords.includes(w));
    const uniqueWords = [...new Set(words)];

    if (uniqueWords.length === 0) return res.json([]);

    const keywordConditions = uniqueWords.map((w) => ({
      $or: [
        { title: { $regex: w, $options: "i" } },
        { description: { $regex: w, $options: "i" } },
      ],
    }));

    const matches = await Item.find({
      type: oppositeType,
      archived: false,
      resolved: false,
      postedBy: { $ne: req.userId },
      $or: keywordConditions,
    })
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Failed to find matches" });
  }
});

// POST /api/items/:id/confirm-match — links a lost+found pair together
// and opens (or reuses) a shared conversation between their two owners.
// Does NOT resolve the items yet — resolving happens later, from the
// item's own page, once the two people have actually talked and are
// sure it's the same item.
router.post("/:id/confirm-match", requireAuth, async (req, res) => {
  try {
    const { matchedItemId } = req.body;
    if (!matchedItemId) {
      return res.status(400).json({ error: "matchedItemId is required" });
    }

    const itemA = await Item.findById(req.params.id);
    const itemB = await Item.findById(matchedItemId);
    if (!itemA || !itemB) return res.status(404).json({ error: "Item not found" });

    if (itemA.type === itemB.type) {
      return res.status(400).json({ error: "Matched items must be one lost and one found" });
    }

    const isOwnerA = itemA.postedBy.toString() === req.userId;
    const isOwnerB = itemB.postedBy.toString() === req.userId;
    if (!isOwnerA && !isOwnerB) {
      return res.status(403).json({ error: "You must own one of these posts" });
    }

    // Link them to each other. This is what lets "Mark as Resolved"
    // later cascade to both sides automatically.
    itemA.matchedWith = itemB._id;
    itemB.matchedWith = itemA._id;
    await itemA.save();
    await itemB.save();

    // Figure out which item is "lost" and which is "found", purely
    // for consistent display ordering (item = lost, relatedItem = found).
    const lostItem = itemA.type === "lost" ? itemA : itemB;
    const foundItem = itemA.type === "found" ? itemA : itemB;
    const ownerOfLost = lostItem.postedBy.toString();
    const ownerOfFound = foundItem.postedBy.toString();

    // Reuse an existing conversation between these two people about
    // either of these two items, instead of always creating a new one.
    let conversation = await Conversation.findOne({
      participants: { $all: [ownerOfLost, ownerOfFound] },
      $or: [
        { item: lostItem._id },
        { item: foundItem._id },
        { relatedItem: lostItem._id },
        { relatedItem: foundItem._id },
      ],
    });

    if (conversation) {
      // Make sure both items are attached to it now that they're matched.
      conversation.item = lostItem._id;
      conversation.relatedItem = foundItem._id;
      await conversation.save();
    } else {
      conversation = await Conversation.create({
        participants: [ownerOfLost, ownerOfFound],
        item: lostItem._id,
        relatedItem: foundItem._id,
      });
    }

    res.json({ conversationId: conversation._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to confirm match" });
  }
});

// GET /api/items/:id — public detail view
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("postedBy", "name");
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// POST /api/items — protected
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, type, location, date, imageUrl, contactInfo } = req.body;

    if (!title || !description || !type || !location || !date || !contactInfo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newItem = new Item({
      title, description, type, location, date, imageUrl, contactInfo,
      postedBy: req.userId,
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create item" });
  }
});

// PATCH /api/items/:id — protected + owner-only (used for edit and mark-resolved)
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (item.postedBy.toString() !== req.userId) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("postedBy", "name");

    // If this update is a "mark as resolved" AND this item is linked
    // to a matched item, resolve that matched item too — so a lost/
    // found pair always shows resolved together, from whichever side
    // the owner clicks first.
    if (req.body.resolved === true && updatedItem.matchedWith) {
      await Item.findByIdAndUpdate(updatedItem.matchedWith, { resolved: true });
    }

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE /api/items/:id — now a SOFT delete: sets archived = true instead
// of removing the document, so it still shows up in "My Posts".
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (item.postedBy.toString() !== req.userId) {
      return res.status(403).json({ error: "You can only remove your own posts" });
    }

    // Once an item is resolved, it becomes a permanent record — this
    // helps other students trust the platform (proof that lost items
    // genuinely get returned) and prevents someone from hiding a
    // resolved case that later turns out to be disputed/wrong.
    if (item.resolved) {
      return res.status(400).json({
        error: "Resolved posts can't be removed — they stay visible as a record.",
      });
    }

    item.archived = true;
    await item.save();

    res.json({ message: "Item removed from public listing" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item" });
  }
});

export default router;