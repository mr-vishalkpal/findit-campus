import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/auth/signup", { name, email, password });
      login(response.data.user, response.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-line rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber";

  return (
    <div className="max-w-sm mx-auto px-6 py-12">
      <h1 className="font-display text-2xl font-bold mb-6">Sign Up</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-line rounded-lg p-6">
        <div>
          <label className="block text-sm font-semibold mb-1">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} />
        </div>

        {error && <p className="text-clay text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber text-navy font-semibold px-4 py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-amber font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default Signup;