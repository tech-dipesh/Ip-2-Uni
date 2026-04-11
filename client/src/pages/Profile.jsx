import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faStar, faShield, faSpinner, faVideo, faLock } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";

export default function Profile() {
  const { username }        = useParams();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // /profile (no username) = own profile, requires auth
  const isOwnProfile = !username;

  useEffect(() => {
    // Don't even try the API if it's /profile and user is logged out
    if (isOwnProfile && !isAuthenticated) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const endpoint = isOwnProfile ? "/profile/me" : `/profile/${username}`;
        const { data } = await api.get(endpoint);
        setProfile(data.profile);
      } catch (err) {
        setError(err.response?.data?.message || "Profile not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [username, isAuthenticated]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <FontAwesomeIcon icon={faSpinner} className="text-slate-400 text-3xl animate-spin" />
    </div>
  );

  // Logged-out user visiting /profile — show a clean prompt instead of raw error
  if (isOwnProfile && !isAuthenticated) return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-neutral-800 border border-neutral-700 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center mx-auto mb-5">
          <FontAwesomeIcon icon={faLock} className="text-slate-400 text-2xl" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Sign in to view your profile</h2>
        <p className="text-neutral-400 text-sm mb-6">
          Create an account to track your reputation, session history, and more.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="cursor-pointer block w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition text-center"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="cursor-pointer block w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl text-sm font-medium transition text-center"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-neutral-400 mb-4">{error}</p>
        <Link to="/" className="text-slate-400 hover:text-white text-sm transition">Go home</Link>
      </div>
    </div>
  );

  if (!profile) return null;

  const repColor = profile.reputation_score >= 80 ? "text-green-400"
    : profile.reputation_score >= 50 ? "text-yellow-400" : "text-red-400";
  const repLabel = profile.reputation_score >= 80 ? "Excellent"
    : profile.reputation_score >= 50 ? "Good" : "Low";

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8 text-center">

          <div className="w-24 h-24 rounded-full bg-neutral-700 border-2 border-neutral-600 flex items-center justify-center mx-auto mb-5 overflow-hidden">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              : <FontAwesomeIcon icon={faUser} className="text-neutral-400 text-4xl" />
            }
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-white text-2xl font-bold">@{profile.username}</h2>
            {profile.is_verified && (
              <FontAwesomeIcon icon={faShield} className="text-slate-400" title="Verified" />
            )}
          </div>

          <p className="text-neutral-500 text-sm mb-6">
            {profile.session_count} session{profile.session_count !== 1 ? "s" : ""}
          </p>

          <div className="bg-neutral-700 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faStar} className={`text-sm ${repColor}`} />
              <span className="text-neutral-300 text-sm">Reputation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${repColor}`}>{profile.reputation_score}</span>
              <span className={`text-xs ${repColor}`}>{repLabel}</span>
            </div>
          </div>
        </div>

        {isOwnProfile && isAuthenticated && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-center">
            <p className="text-neutral-400 text-sm mb-4">Ready to meet someone new?</p>
            <Link
              to="/video"
              className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition"
            >
              <FontAwesomeIcon icon={faVideo} />
              Start a Video Call
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}