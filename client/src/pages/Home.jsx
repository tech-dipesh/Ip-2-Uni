import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo, faUserSecret, faShield, faStar,
  faUsers, faComments, faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";

const FEATURES = [
  { icon: faUserSecret, title: "Anonymous Mode",    desc: "Join as a guest — zero signup, zero traces." },
  { icon: faUsers,      title: "Mood Matching",     desc: "Study, network, or just chat. You pick the vibe." },
  { icon: faComments,   title: "Live Chat Sidebar", desc: "Text alongside your video call, always visible." },
  { icon: faStar,       title: "Reputation Score",  desc: "Good actors rise. Bad actors get filtered out." },
  { icon: faShield,     title: "Private by Design", desc: "No data sold. No ads. Peer-to-peer WebRTC." },
  { icon: faVideo,      title: "HD Video",          desc: "Direct peer-to-peer connection — minimal latency." },
];

const STEPS = [
  { num: "01", title: "Choose Your Mood",  desc: "Casual chat, study session, or networking — pick what fits right now." },
  { num: "02", title: "Get Matched",       desc: "Our queue finds someone with the same mood in seconds." },
  { num: "03", title: "Start Talking",     desc: "Jump into a video call with live chat on the side. No setup." },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center justify-center text-center px-4 py-28 md:py-40">
        <div className="inline-flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-1.5 text-xs text-neutral-400 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live now — real people, real conversations
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 max-w-4xl">
          Meet someone{" "}
          <span className="text-slate-400">unexpected</span>
        </h1>

        <p className="text-neutral-400 text-lg md:text-xl max-w-lg mb-10">
          Anonymous video calls, mood-based matching, zero algorithms. Just people.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/video"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition"
          >
            <FontAwesomeIcon icon={faVideo} />
            Start Anonymously
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-xl transition"
          >
            Create Account
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </section>

      <section className="bg-neutral-800 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">How it works</h2>
          <p className="text-neutral-400 text-center mb-14 max-w-md mx-auto text-sm">
            Three steps between you and a new connection.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="bg-neutral-700 rounded-2xl p-6">
                <span className="text-5xl font-black text-slate-600 block mb-4">{s.num}</span>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">Everything you need</h2>
          <p className="text-neutral-400 text-center mb-14 max-w-md mx-auto text-sm">
            Built with privacy and simplicity first.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 hover:border-slate-600 transition"
              >
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={f.icon} className="text-slate-300" />
                </div>
                <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
