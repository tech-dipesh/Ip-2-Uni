import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faStar, faShield, faSpinner, faVideo } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";

export default function Profile() {
  const { username }      = useParams();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

useEffect(() => {
  (async () => {
    try {
      setLoading(true);
      const endpoint = username ? `/profile/${username}` : "/profile/me";
      const { data } = await api.get(endpoint);
      setProfile(data.profile);
    } catch (err) {
      setError(err.response?.data?.message || "Profile not found");
    } finally {
      setLoading(false);
    }
  })();
}, [username]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <FontAwesomeIcon icon={faSpinner} className="text-slate-400 text-3xl animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-neutral-400">{error}</p>
    </div>
  );

  const repColor =
    profile.reputation_score >= 80 ? "text-green-400" :
    profile.reputation_score >= 50 ? "text-yellow-400" : "text-red-400";

  const repLabel =
    profile.reputation_score >= 80 ? "Excellent" :
    profile.reputation_score >= 50 ? "Good" : "Low";

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-4">

        {/* Card */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8 text-center">

          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-neutral-700 border-2 border-neutral-600 flex items-center justify-center mx-auto mb-5 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <FontAwesomeIcon icon={faUser} className="text-neutral-400 text-4xl" />
            )}
          </div>

          {/* Username + badge */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-white text-2xl font-bold">@{profile.username}</h2>
            {profile.is_verified && (
              <FontAwesomeIcon icon={faShield} className="text-slate-400" title="Verified" />
            )}
          </div>

          {/* Session count */}
          <p className="text-neutral-500 text-sm mb-6">
            {profile.session_count} session{profile.session_count !== 1 ? "s" : ""}
          </p>

          {/* Reputation */}
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

        {/* CTA for own profile */}
        {!username && isAuthenticated && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-center">
            <p className="text-neutral-400 text-sm mb-4">Ready to meet someone new?</p>
            <a
              href="/video"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition"
            >
              <FontAwesomeIcon icon={faVideo} />
              Start a Video Call
            </a>
          </div>
        )}
      </div>
    </div>
  );
}