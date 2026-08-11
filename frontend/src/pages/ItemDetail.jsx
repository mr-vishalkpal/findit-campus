import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      try {
        const response = await api.get(`/items/${id}`);
        setItem(response.data);
      } catch (err) {
        setError("Item not found.");
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id]);

  async function handleMarkResolved() {
    try {
      const response = await api.patch(`/items/${id}`, { resolved: true });
      setItem(response.data);
    } catch (err) {
      alert("Failed to update item.");
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    try {
      await api.delete(`/items/${id}`);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete item.");
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!item) return null;

  const isOwner = user && item.postedBy?._id === user.id;

  return (
    <div>
      <Link to="/">&larr; Back to all items</Link>

      <h1>
        {item.title} ({item.type})
      </h1>
      <p>{item.description}</p>
      <p>Location: {item.location}</p>
      <p>Date: {new Date(item.date).toLocaleDateString()}</p>
      <p>Posted by: {item.postedBy?.name || "Unknown"}</p>
      <p>Status: {item.resolved ? "Resolved" : "Not resolved"}</p>

      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.title} style={{ maxWidth: "300px" }} />
      )}

      <div style={{ marginTop: "1rem" }}>
        {showContact ? (
          <p>Contact: {item.contactInfo}</p>
        ) : (
          <button onClick={() => setShowContact(true)}>Reveal Contact Info</button>
        )}
      </div>

      {isOwner && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
          {!item.resolved && <button onClick={handleMarkResolved}>Mark as Resolved</button>}
          <button onClick={handleDelete}>Delete Post</button>
        </div>
      )}
    </div>
  );
}

export default ItemDetail;