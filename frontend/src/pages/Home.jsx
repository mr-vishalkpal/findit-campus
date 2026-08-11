import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (typeFilter) params.type = typeFilter;

        const response = await api.get("/items", { params });
        setItems(response.data);
      } catch (err) {
        setError("Failed to load items. Is the backend server running?");
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchItems, 400);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Find what's lost. Return what's found.</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-line rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-line rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber"
        >
          <option value="">All items</option>
          <option value="lost">Lost only</option>
          <option value="found">Found only</option>
        </select>
      </div>

      {loading && <p className="text-ink/60">Loading items...</p>}
      {error && <p className="text-clay">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-ink/60">No items found. Be the first to post one.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item._id} to={`/items/${item._id}`}>
            <div
              className={`border border-line rounded-lg p-4 bg-white hover:shadow-md transition ${
                item.resolved ? "opacity-50" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-bold text-lg">{item.title}</h3>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${
                    item.type === "lost" ? "bg-clay" : "bg-teal"
                  }`}
                >
                  {item.type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-ink/70">{item.location}</p>
              <p className="text-sm text-ink/50">
                {new Date(item.date).toLocaleDateString()}
              </p>
              {item.resolved && (
                <p className="text-xs font-semibold text-teal mt-2">RESOLVED</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;