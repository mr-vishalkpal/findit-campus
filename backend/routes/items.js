import express from "express";
import Item from "../models/Item.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { type, search, resolved } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (resolved !== undefined) filter.resolved = resolved === "true";

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .populate("postedBy", "name");

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("postedBy", "name");
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, type, location, date, imageUrl, contactInfo } = req.body;

    if (!title || !description || !type || !location || !date || !contactInfo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newItem = new Item({
      title,
      description,
      type,
      location,
      date,
      imageUrl,
      contactInfo,
      postedBy: req.userId,
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create item" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (item.postedBy.toString() !== req.userId) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;