// routes/items.js
//
// GET    /api/items       -> list all items (with optional search/filter)
// GET    /api/items/:id   -> get one item by id
// POST   /api/items       -> create a new item
// PATCH  /api/items/:id   -> update an item (e.g. mark resolved)
// DELETE /api/items/:id   -> delete an item

import express from "express";
import Item from "../models/Item.js";

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

    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, type, location, date, imageUrl, contactInfo } = req.body;

    if (!title || !description || !type || !location || !date || !contactInfo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newItem = new Item({ title, description, type, location, date, imageUrl, contactInfo });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create item" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedItem) return res.status(404).json({ error: "Item not found" });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;