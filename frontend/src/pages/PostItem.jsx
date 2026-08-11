import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function PostItem() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "lost",
    location: "",
    date: "",
    imageUrl: "",
    contactInfo: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/items", formData);
      navigate(`/items/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to post item. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-line rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber";
  const labelClass = "block text-sm font-semibold mb-1";

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">Post a Lost or Found Item</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-line rounded-lg p-6">
        <div>
          <label className={labelClass}>Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Image URL (optional)</label>
          <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Contact Info (email or phone)</label>
          <input type="text" name="contactInfo" value={formData.contactInfo} onChange={handleChange} required className={inputClass} />
        </div>

        {error && <p className="text-clay text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber text-navy font-semibold px-4 py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post Item"}
        </button>
      </form>
    </div>
  );
}

export default PostItem;