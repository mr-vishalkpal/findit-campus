import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const matchWithId = searchParams.get("matchWith"); // set when arriving from "Check Item"

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
    const confirmed = window.confirm("Are you sure you want to remove this post?");
    if (!confirmed) return;
    try {
      await api.delete(`/items/${id}`);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove item.");
    }
  }

  function requireLoginThen(action) {
    if (!user) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    action();
  }

  async function handleMessagePoster() {
    setMessaging(true);
    try {
      const response = await api.post("/conversations", {
        itemId: item._id,
        otherUserId: item.postedBy._id,
      });
      navigate(`/chat/${response.data._id}`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to start conversation.");
    } finally {
      setMessaging(false);
    }
  }

  // Confirms the match between THIS item (found via "Check Item") and
  // the user's own item that was passed in the URL (?matchWith=...).
  async function handleConfirmMatch() {
    const confirmed = window.confirm(
      "Confirm this looks like the same item? This will open a chat with the other person so you can work out the return."
    );
    if (!confirmed) return;

    setConfirming(true);
    try {
      const response = await api.post(`/items/${matchWithId}/confirm-match`, {
        matchedItemId: item._id,
      });
      navigate(`/chat/${response.data.conversationId}`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to confirm match.");
    } finally {
      setConfirming(false);
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

      {/* Banner shown only when arriving here to check a possible match */}
      {matchWithId && !isOwner && (
        <div className="bg-amber/20 border border-amber rounded-lg px-4 py-3 mt-4 flex justify-between items-center flex-wrap gap-3">
          <p className="text-sm font-semibold text-navy">
            Checking if this matches your post?
          </p>
          <button
            onClick={handleConfirmMatch}
            disabled={confirming}
            className="bg-amber text-navy text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
          >
            {confirming ? "Confirming..." : "Yes, Confirm Match"}
          </button>
        </div>
      )}

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
              {item.resolved ? (item.type === "found" ? "Returned" : "Resolved") : "Not resolved"}
            </span>
          </p>
        </div>

        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.title} className="max-w-full rounded-md border border-line mb-4" />
        )}

        {!isOwner && (
          <div className="mb-4 flex flex-wrap gap-3">
            {showContact ? (
              <p className="bg-paper border border-line rounded-md px-4 py-2 text-sm">
                Contact: {item.contactInfo}
              </p>
            ) : (
              <button
                onClick={() => requireLoginThen(() => setShowContact(true))}
                className="bg-amber text-navy font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
              >
                Reveal Contact Info
              </button>
            )}

            <button
              onClick={() => requireLoginThen(handleMessagePoster)}
              disabled={messaging}
              className="bg-navy text-white font-semibold px-4 py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
            >
              {messaging ? "Starting chat..." : `Message ${item.postedBy?.name || "Poster"}`}
            </button>
          </div>
        )}

        {isOwner && (
          <div className="pt-3 border-t border-line">
            {item.resolved ? (
              <p className="text-sm text-ink/50 italic">
                This post is resolved and now serves as a public record. It can't be edited or removed.
              </p>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleMarkResolved}
                  className="bg-teal text-white font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => navigate(`/items/${id}/edit`)}
                  className="bg-navy text-white font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-clay text-white font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
                >
                  Remove Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;