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

  if (loading) return <p className="max-w-2xl mx-auto px-6 py-8 text-ink/60">Loading...</p>;
  if (error) return <p className="max-w-2xl mx-auto px-6 py-8 text-clay">{error}</p>;
  if (!item) return null;

  const isOwner = user && item.postedBy?._id === user.id;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link to="/" className="text-sm text-ink/60 hover:underline">
        &larr; Back to all items
      </Link>

      <div className="bg-white border border-line rounded-lg p-6 mt-4">
        <div className="flex justify-between items-start mb-3">
          <h1 className="font-display text-2xl font-bold">{item.title}</h1>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${
              item.type === "lost" ? "bg-clay" : "bg-teal"
            }`}
          >
            {item.type.toUpperCase()}
          </span>
        </div>

        <p className="text-ink/80 mb-4">{item.description}</p>

        <div className="text-sm text-ink/60 space-y-1 mb-4">
          <p>Location: {item.location}</p>
          <p>Date: {new Date(item.date).toLocaleDateString()}</p>
          <p>Posted by: {item.postedBy?.name || "Unknown"}</p>
          <p>
            Status:{" "}
            <span className={item.resolved ? "text-teal font-semibold" : ""}>
              {item.resolved ? "Resolved" : "Not resolved"}
            </span>
          </p>
        </div>

        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-w-full rounded-md border border-line mb-4"
          />
        )}

        <div className="mb-4">
          {showContact ? (
            <p className="bg-paper border border-line rounded-md px-4 py-2 text-sm">
              Contact: {item.contactInfo}
            </p>
          ) : (
            <button
              onClick={() => setShowContact(true)}
              className="bg-amber text-navy font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              Reveal Contact Info
            </button>
          )}
        </div>

        {isOwner && (
          <div className="flex gap-3 pt-3 border-t border-line">
            {!item.resolved && (
              <button
                onClick={handleMarkResolved}
                className="bg-teal text-white font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
              >
                Mark as Resolved
              </button>
            )}
            <button
              onClick={handleDelete}
              className="bg-clay text-white font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              Delete Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;