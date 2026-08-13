import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Polls the conversations list every 8 seconds to check for new
  // unread messages, and updates the little red badge on the icon.
  // (A simpler alternative to wiring a global socket listener just
  // for a badge count — good enough for this project's scale.)
  useEffect(() => {
    if (!user) return;

    async function checkUnread() {
      try {
        const response = await api.get("/conversations");
        const total = response.data.reduce((sum, c) => sum + c.unreadCount, 0);
        setUnreadTotal(total);
      } catch (err) {
        // fail silently — not critical
      }
    }

    checkUnread();
    const interval = setInterval(checkUnread, 8000);
    return () => clearInterval(interval);
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="bg-navy text-paper px-6 py-4 flex justify-between items-center">
      <Link to="/" className="font-display text-xl font-bold tracking-tight">
        FindIt Campus
      </Link>

      <div className="flex items-center gap-5 text-sm">
        {user ? (
          <>
            <Link to="/my-posts" className="hover:underline">
              My Posts
            </Link>

            <Link to="/inbox" title="Messages" className="relative hover:opacity-80">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                />
              </svg>
              {unreadTotal > 0 && (
                <span className="absolute -top-2 -right-2 bg-clay text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadTotal > 9 ? "9+" : unreadTotal}
                </span>
              )}
            </Link>

            <Link
              to="/post"
              className="bg-amber text-navy font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              Post Item
            </Link>
            <span className="text-paper/80">Hi, {user.name}</span>
            <button onClick={handleLogout} className="hover:underline">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-amber text-navy font-semibold px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;