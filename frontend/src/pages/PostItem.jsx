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

  return (
    <div>
      <h1>Post a Lost or Found Item</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Type</label>
          <br />
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>

        <div>
          <label>Title</label>
          <br />
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </div>

        <div>
          <label>Description</label>
          <br />
          <textarea name="description" value={formData.description} onChange={handleChange} required />
        </div>

        <div>
          <label>Location</label>
          <br />
          <input type="text" name="location" value={formData.location} onChange={handleChange} required />
        </div>

        <div>
          <label>Date</label>
          <br />
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>

        <div>
          <label>Image URL (optional)</label>
          <br />
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>

        <div>
          <label>Contact Info (email or phone)</label>
          <br />
          <input type="text" name="contactInfo" value={formData.contactInfo} onChange={handleChange} required />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Posting..." : "Post Item"}
        </button>
      </form>
    </div>
  );
}

export default PostItem;