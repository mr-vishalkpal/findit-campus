import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["lost", "found"], required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    imageUrl: { type: String, default: "" },
    contactInfo: { type: String, required: true },
    resolved: { type: Boolean, default: false },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Soft delete: instead of removing the document, we just hide it
    // from public browsing. This lets the owner still see it in
    // "My Posts" — deleting real data is rarely what users actually want.
    archived: {
      type: Boolean,
      default: false,
    },
    // Once a lost + found pair are confirmed as the same item, this
    // links them to each other.
    matchedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.model("Item", itemSchema);

export default Item;