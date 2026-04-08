import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faLock, faEye, faEyeSlash, faShuffle } from "@fortawesome/free-solid-svg-icons";
import { signupUser, clearError } from "../features/auth/authSlice";

export default function Signup() {
  const [form, setForm]         = useState({ username: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (isAuthenticated) navigate("/"); }, [isAuthenticated]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const fields = [
    { key: "username", label: "Username",  type: "text",     icon: faUser,     placeholder: "cooluser_123" },
    { key: "email",    label: "Email",     type: "email",    icon: faEnvelope, placeholder: "you@example.com" },
    { key: "password", label: "Password",  type: "password", icon: faLock,     placeholder: "Min. 8 characters" },
  ];

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white font-bold text-2xl">
            <FontAwesomeIcon icon={faShuffle} className="text-slate-400" />
            RandomRoulette
          </Link>
          <p className="text-neutral-400 mt-2 text-sm">Create your account</p>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {fields.map(({ key, label, type, icon, placeholder }) => (
              <div key={key}>
                <label className="text-neutral-300 text-sm font-medium block mb-1.5">{label}</label>
                <div className="relative">
                  <FontAwesomeIcon icon={icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm" />
                  <input
                    type={key === "password" && showPass ? "text" : type}
                    value={form[key]}
                    onChange={set(key)}
                    placeholder={placeholder}
                    className="w-full bg-neutral-700 border border-neutral-600 text-white rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-slate-500 transition"
                    required
                  />
                  {key === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
                    >
                      <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => dispatch(signupUser(form))}
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </div>

          <p className="text-center text-neutral-400 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-slate-400 hover:text-white transition">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-neutral-500 text-xs mt-4">
          <Link to="/video" className="hover:text-neutral-300 transition">Continue as guest →</Link>
        </p>
      </div>
    </div>
  );
}