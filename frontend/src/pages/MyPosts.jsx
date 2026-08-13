import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function MyPosts() {
  const [items, setItems] = useState([]);
  const [matchesByItem, setMatchesByItem] = useState({}); // { itemId: [matches] }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get("/items/mine");
        setItems(response.data);

        // For every active (not resolved, not archived) item, also fetch
        // its possible matches, so we can show them right below it.
        const activeItems = response.data.filter((i) => !i.resolved && !i.archived);
        const matchResults = await Promise.all(
          activeItems.map((i) => api.get(`/items/${i._id}/matches`))
        );
        const matchMap = {};
        activeItems.forEach((i, index) => {
          matchMap[i._id] = matchResults[index].data;
        });
        setMatchesByItem(matchMap);
      } catch (err) {
        console.error("Failed to load your posts", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleConfirmMatch(itemId, matchedItemId) {
    const confirmed = window.confirm(
      "Confirm this is the same item? Both posts will be marked resolved."
    );
    if (!confirmed) return;

    try {
      await api.post(`/items/${itemId}/confirm-match`, { matchedItemId });
      // Refresh the page's data so statuses update
      const response = await api.get("/items/mine");
      setItems(response.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to confirm match.");
    }
  }

  if (loading) return <p className="max-w-3xl mx-auto px-6 py-8 text-ink/60">Loading...</p>;

  const active = items.filter((i) => !i.resolved && !i.archived);
  const resolved = items.filter((i) => i.resolved);
  const archived = items.filter((i) => i.archived && !i.resolved);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">My Posts</h1>

      {items.length === 0 && (
        <p className="text-ink/60">You haven't posted anything yet.</p>
      )}

      {/* ---- Active posts + their possible matches ---- */}
      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-ink/70 mb-3">Active</h2>
          <div className="space-y-4">
            {active.map((item) => (
              <div key={item._id} className="bg-white border border-line rounded-lg p-4">
                <Link to={`/items/${item._id}`}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-display font-bold">{item.title}</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${
                        item.type === "lost" ? "bg-clay" : "bg-teal"
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-ink/60">{item.location}</p>
                </Link>

                {/* Possible matches for this specific post — clicking
                    "Check Item" opens the full detail page, where the
                    user can actually see photos/description before
                    deciding whether to confirm the match. Confirming
                    now happens from that detail page instead of blindly
                    here in the list. */}
                {matchesByItem[item._id]?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-line">
                    <p className="text-sm font-semibold text-amber mb-2">
                      Possible matches found:
                    </p>
                    <div className="space-y-2">
                      {matchesByItem[item._id].map((match) => (
                        <div
                          key={match._id}
                          className="bg-paper border border-line rounded-md p-3 flex justify-between items-center gap-3"
                        >
                          <div>
                            <p className="font-semibold text-sm">{match.title}</p>
                            <p className="text-xs text-ink/60">
                              {match.location} · by {match.postedBy?.name}
                            </p>
                          </div>
                          <Link
                            to={`/items/${match._id}?matchWith=${item._id}`}
                            className="bg-amber text-navy text-xs font-semibold px-3 py-2 rounded-md hover:opacity-90 transition whitespace-nowrap"
                          >
                            Check Item
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Resolved posts ---- */}
      {resolved.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-ink/70 mb-3">Resolved</h2>
          <div className="space-y-2">
            {resolved.map((item) => (
              <Link key={item._id} to={`/items/${item._id}`}>
                <div className="bg-white border border-line rounded-lg p-4 opacity-60">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-xs text-teal font-semibold">
                    {item.type === "found" ? "Returned" : "Resolved"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ---- Archived (removed) posts — kept for history ---- */}
      {archived.length > 0 && (
        <div>
          <h2 className="font-semibold text-ink/70 mb-3">Removed</h2>
          <div className="space-y-2">
            {archived.map((item) => (
              <div key={item._id} className="bg-white border border-line rounded-lg p-4 opacity-40">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-xs text-ink/50">No longer publicly listed</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPosts;