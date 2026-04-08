import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShuffle, faShield, faFileAlt } from "@fortawesome/free-solid-svg-icons";

export default function Footer() {
  return (
    <footer className="bg-neutral-800 border-t border-neutral-700 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
            <FontAwesomeIcon icon={faShuffle} className="text-slate-400" />
            RandomRoulette
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Anonymous video calls and mood-based matching. Real-time, private, no algorithms.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Quick Links</h4>
          <ul className="space-y-2 text-sm text-neutral-400">
            {[
              ["/video",  "Join Video Call"],
              ["/chat",   "Chat Someone"],
              ["/signup", "Create Account"],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-white transition">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Legal</h4>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faShield} className="text-xs" />
              Privacy Policy
            </li>
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
              Terms of Service
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 border-t border-neutral-700 mt-10 pt-6 text-center text-neutral-500 text-sm">
        © {new Date().getFullYear()} RandomRoulette. All rights reserved.
      </div>
    </footer>
  );
}