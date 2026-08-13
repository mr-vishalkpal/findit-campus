import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      login(response.data.user, response.data.token);
      // If we arrived here via "requireLoginThen" redirect, go back to
      // that exact page. Otherwise go to home as usual.
      navigate(location.state?.from || "/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-line rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber";

  return (
    <div className="max-w-sm mx-auto px-6 py-12">
      <h1 className="font-display text-2xl font-bold mb-6">Log In</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-line rounded-lg p-6">
        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Password</label>
          {/* relative + absolute lets the toggle button sit INSIDE the
              input's right edge, instead of taking its own space below it */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass + " pr-16"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-navy/60 hover:text-navy"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && <p className="text-clay text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber text-navy font-semibold px-4 py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-4">
        Don't have an account?{" "}
        <Link to="/signup" className="text-amber font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default Login;