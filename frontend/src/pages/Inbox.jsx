import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Inbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await api.get("/conversations");
        setConversations(response.data);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <Link to="/" className="text-sm text-ink/60 hover:underline">
        &larr; Back to all items
      </Link>

      <h1 className="font-display text-2xl font-bold mt-4 mb-6">Messages</h1>

      {loading && <p className="text-ink/60">Loading...</p>}
      {!loading && conversations.length === 0 && (
        <p className="text-ink/60">No conversations yet. Start one from an item's detail page.</p>
      )}

      <div className="space-y-3">
        {conversations.map((conv) => {
          const otherPerson = conv.participants.find((p) => p._id !== user.id);
          const hasUnread = conv.unreadCount > 0;

          return (
            <Link key={conv._id} to={`/chat/${conv._id}`}>
              <div
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition flex justify-between items-center ${
                  hasUnread ? "border-amber border-2" : "border-line"
                }`}
              >
                <div>
                  <p className={hasUnread ? "font-bold" : "font-semibold"}>
                    {otherPerson?.name || "Unknown user"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${
                        conv.item?.type === "lost" ? "bg-clay" : "bg-teal"
                      }`}
                    >
                      {conv.item?.type?.toUpperCase() || "ITEM"}
                    </span>
                    <p className="text-sm text-ink/60">{conv.item?.title || "Deleted item"}</p>
                  </div>
                </div>

                {hasUnread && (
                  <span className="bg-clay text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Inbox;