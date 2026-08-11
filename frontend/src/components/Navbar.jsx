import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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