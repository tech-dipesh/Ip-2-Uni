import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faEye, faEyeSlash, faShuffle } from "@fortawesome/free-solid-svg-icons";
import { loginUser, clearError } from "../features/auth/authSlice";

export default function Login() {
  const [form, setForm]         = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Logged in successfully!");
      navigate("/");
    }
  }, [isAuthenticated]);

  // Show error toast whenever Redux error changes
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = () => {
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    dispatch(loginUser(form));
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white font-bold text-2xl">
            <FontAwesomeIcon icon={faShuffle} className="text-slate-400" />
            RandomRoulette
          </Link>
          <p className="text-neutral-400 mt-2 text-sm">Welcome back</p>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8">
          <div className="space-y-5">
            <div>
              <label className="text-neutral-300 text-sm font-medium block mb-1.5">Email</label>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm" />
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="you@example.com"
                  className="cursor-text w-full bg-neutral-700 border border-neutral-600 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-slate-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-300 text-sm font-medium block mb-1.5">Password</label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm" />
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  className="cursor-text w-full bg-neutral-700 border border-neutral-600 text-white rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-slate-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
                >
                  <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} className="text-sm" />
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="cursor-pointer w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>

          <p className="text-center text-neutral-400 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="cursor-pointer text-slate-400 hover:text-white transition">Sign up</Link>
          </p>
        </div>

        <p className="text-center text-neutral-500 text-xs mt-4">
          <Link to="/video" className="cursor-pointer hover:text-neutral-300 transition">Continue as guest →</Link>
        </p>
      </div>
    </div>
  );
}