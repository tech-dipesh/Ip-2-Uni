import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo, faComments, faUser, faSignInAlt,
  faUserPlus, faSignOutAlt, faShuffle,
} from "@fortawesome/free-solid-svg-icons";
import { logoutUser } from "../features/auth/authSlice";

const NavLink = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-700 hover:text-white transition text-sm"
  >
    <FontAwesomeIcon icon={icon} />
    <span className="hidden sm:inline">{label}</span>
  </Link>
);

export default function Header() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  return (
    <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <FontAwesomeIcon icon={faShuffle} className="text-slate-400" />
          <span>RandomRoulette</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <NavLink to="/video" icon={faVideo}    label="Join Video Call" />
          <NavLink to="/chat"  icon={faComments} label="Chat Someone" />

          {isAuthenticated ? (
            <>
              <NavLink to="/profile" icon={faUser} label={user?.username} />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-red-900 hover:text-white transition text-sm"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login"  icon={faSignInAlt} label="Login" />
              <Link
                to="/signup"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition text-sm"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                <span className="hidden sm:inline">Sign Up</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}