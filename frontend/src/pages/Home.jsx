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
    <div>
      <h1>Campus Lost & Found</h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
      </div>

      {loading && <p>Loading items...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && items.length === 0 && <p>No items found.</p>}

      <div>
        {items.map((item) => (
          <Link key={item._id} to={`/items/${item._id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div
              style={{
                border: "1px solid #ccc",
                padding: "1rem",
                marginBottom: "1rem",
                opacity: item.resolved ? 0.6 : 1,
              }}
            >
              <h3>
                {item.title} ({item.type})
              </h3>
              <p>{item.location}</p>
              <p>{new Date(item.date).toLocaleDateString()}</p>
              {item.resolved && <strong>Resolved</strong>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;