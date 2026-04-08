import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo, faVideoSlash, faMicrophone, faMicrophoneSlash,
  faForward, faPhoneSlash, faFlag, faHeart, faSpinner,
  faComments, faPaperPlane, faSmile,
} from "@fortawesome/free-solid-svg-icons";
import useWebRTC from "../hooks/useWebRTC";
import api from "../services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

const MOODS = [
  { id: "casual_chat", label: "Casual Chat", emoji: "💬" },
  { id: "study",       label: "Study",       emoji: "📚" },
  { id: "networking",  label: "Networking",  emoji: "🤝" },
];

const INTERESTS = [
  "Music","Gaming","Sports","Movies","Tech",
  "Travel","Food","Art","Reading","Fitness","Photography","Science",
];

const QUICK_EMOJIS = ["😀","😂","😍","🥺","😎","🤔","👍","❤️","🎉","🔥","👋","😮"];

export default function Video() {
  const { user } = useSelector((s) => s.auth);

  const [stage, setStage]           = useState("onboarding"); // onboarding | waiting | connected | ended
  const [mood, setMood]             = useState("");
  const [interests, setInterests]   = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMuted, setIsMuted]       = useState(false);
  const [isCamOff, setIsCamOff]     = useState(false);
  const [messages, setMessages]     = useState([]);
  const [msgInput, setMsgInput]     = useState("");
  const [showEmoji, setShowEmoji]   = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [roomId, setRoomId]         = useState(null);
  const [sessionId, setSessionId]   = useState(null);

  const socketRef     = useRef(null);
  const messagesEndRef = useRef(null);

  const { localVideoRef, remoteVideoRef, startLocalStream, initiateCall, handleSignal, toggleAudio, toggleVideo, cleanup } =
    useWebRTC({
      socketRef,
      onConnectionStateChange: (state) => {
        if (state === "disconnected" || state === "failed") setStage("ended");
      },
    });
    
const endSession = async (status = "ended", isSaved = false) => {
  if (!sessionId) return;
  try { await api.patch(`/video/session/${sessionId}/end`, { status, isSaved }); }
  catch { /* non-critical */ }
};
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

useEffect(() => {
  socketRef.current = io(SOCKET_URL, {
    withCredentials: true,
    auth: { userId: user?.id || null },
  });

  const socket = socketRef.current;

  socket.on("match_found", async ({ roomId: rid, initiator }) => {
    setRoomId(rid);
    setStage("connected");
    await startLocalStream();

    if (initiator) {
      await initiateCall(rid);
      try {
        const { data } = await api.post("/video/session/start", { roomId: rid, mood });
        setSessionId(data.session.id);
      } catch {
        console.log('hello')
      }
    }
  });

  socket.on("signal", (payload) => {
  handleSignal(payload, payload.roomId);
});
  socket.on("waiting", () => setStage("waiting"));
  socket.on("peer_left", () => {
    setStage("ended");
    endSession("ended");
  });
  socket.on("chat_message", (msg) =>
    setMessages((p) => [...p, { ...msg, self: false }])
  );

  return () => {
    socket.off();
    socket.disconnect();
    cleanup();
  };
}, [user?.id]);

  const handleFindMatch = async () => {
    if (!mood) return;
    await startLocalStream();
    socketRef.current?.emit("find_match", { mood, interests, isAnonymous });
  };

  const handleSkip = () => {
    endSession("skipped");
    cleanup();
    setMessages([]);
    setRoomId(null);
    setSessionId(null);
    socketRef.current?.emit("skip", { roomId, mood });
  };

  const handleEnd = async () => {
    await endSession("ended");
    cleanup();
    socketRef.current?.emit("leave_room", { roomId });
    setStage("ended");
  };

  const handleSave = () => endSession("ended", true);

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await api.post("/video/report", { sessionId, reason: reportReason });
      setShowReport(false);
      setReportReason("");
    } catch { /* non-critical */ }
  };

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    const msg = { text: msgInput.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    socketRef.current?.emit("chat_message", { roomId, ...msg });
    setMessages((p) => [...p, { ...msg, self: true }]);
    setMsgInput("");
    setShowEmoji(false);
  };

  const toggleInterest = (i) =>
    setInterests((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i]);

  // ── Onboarding ────────────────────────────────────────────────────────────────
  if (stage === "onboarding") return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-neutral-800 border border-neutral-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-1">Set up your session</h2>
        <p className="text-neutral-400 text-sm mb-8">Choose how you want to connect</p>

        {/* Mood */}
        <label className="text-neutral-300 text-sm font-medium block mb-3">Your mood</label>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border transition ${
                mood === m.id
                  ? "bg-slate-700 border-slate-500 text-white"
                  : "bg-neutral-700 border-neutral-600 text-neutral-400 hover:border-slate-600"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-medium">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Interests */}
        <label className="text-neutral-300 text-sm font-medium block mb-3">
          Interests <span className="text-neutral-500 font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-6">
          {INTERESTS.map((i) => (
            <button
              key={i}
              onClick={() => toggleInterest(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                interests.includes(i)
                  ? "bg-slate-700 border-slate-500 text-white"
                  : "bg-neutral-700 border-neutral-600 text-neutral-400 hover:border-slate-600"
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between bg-neutral-700 rounded-xl px-4 py-3 mb-8">
          <div>
            <p className="text-white text-sm font-medium">Anonymous mode</p>
            <p className="text-neutral-400 text-xs">Your identity stays hidden</p>
          </div>
          <button
            onClick={() => setIsAnonymous((p) => !p)}
            className={`w-11 h-6 rounded-full transition-colors relative ${isAnonymous ? "bg-slate-600" : "bg-neutral-600"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAnonymous ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <button
          onClick={handleFindMatch}
          disabled={!mood}
          className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faVideo} />
          Find Match
        </button>
      </div>
    </div>
  );

  // ── Waiting ───────────────────────────────────────────────────────────────────
  if (stage === "waiting") return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <FontAwesomeIcon icon={faSpinner} className="text-slate-400 text-4xl animate-spin mb-5" />
        <h3 className="text-white text-xl font-semibold mb-2">Finding someone for you…</h3>
        <p className="text-neutral-400 text-sm mb-6">
          Mood: <span className="text-slate-400 capitalize">{mood.replace("_", " ")}</span>
        </p>
        <button
          onClick={() => { socketRef.current?.emit("cancel_match"); setStage("onboarding"); }}
          className="text-neutral-500 hover:text-white text-sm transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // ── Ended ─────────────────────────────────────────────────────────────────────
  if (stage === "ended") return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">👋</div>
        <h3 className="text-white text-xl font-semibold mb-2">Session ended</h3>
        <p className="text-neutral-400 text-sm mb-8">Hope that was a good one.</p>
        <button
          onClick={() => { setStage("onboarding"); setMessages([]); setRoomId(null); setSessionId(null); }}
          className="px-7 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition"
        >
          Find Another Match
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="relative bg-black flex-1" style={{ minWidth: 0 }}>
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <video
          ref={localVideoRef}
          autoPlay playsInline muted
          className="absolute bottom-20 right-3 w-36 h-24 md:w-48 md:h-32 rounded-xl object-cover border-2 border-neutral-700 shadow-xl"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-4 py-4 flex items-center justify-center gap-2 flex-wrap">
          <Btn icon={isMuted  ? faMicrophoneSlash : faMicrophone}
            onClick={() => { const e = toggleAudio(); setIsMuted(!e); }}
            label={isMuted ? "Unmute" : "Mute"} active={isMuted} />
          <Btn icon={isCamOff ? faVideoSlash : faVideo}
            onClick={() => { const e = toggleVideo(); setIsCamOff(!e); }}
            label={isCamOff ? "Cam On" : "Cam Off"} active={isCamOff} />
          <Btn icon={faForward}   onClick={handleSkip}              label="Skip"   cls="bg-slate-700 hover:bg-slate-600" />
          <Btn icon={faPhoneSlash} onClick={handleEnd}              label="End"    cls="bg-red-700 hover:bg-red-600" />
          <Btn icon={faHeart}     onClick={handleSave}              label="Save"   cls="bg-neutral-700 hover:bg-neutral-600" />
          <Btn icon={faFlag}      onClick={() => setShowReport(true)} label="Report" cls="bg-neutral-700 hover:bg-neutral-600" />
        </div>
      </div>

      {/* Chat sidebar — 30% */}
      <div className="w-[30%] min-w-60 max-w-xs bg-neutral-800 border-l border-neutral-700 flex flex-col">
        <div className="px-4 py-3 border-b border-neutral-700 flex items-center gap-2">
          <FontAwesomeIcon icon={faComments} className="text-slate-400 text-sm" />
          <span className="text-white font-semibold text-sm">Live Chat</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-neutral-500 text-xs text-center mt-8">Say hi 👋</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}>
              <div className={`max-w-[90%] px-3 py-2 rounded-xl text-sm leading-snug ${msg.self ? "bg-slate-700 text-white" : "bg-neutral-700 text-neutral-200"}`}>
                {msg.text}
              </div>
              <span className="text-neutral-500 text-[10px] mt-0.5 px-1">{msg.time}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji picker */}
        {showEmoji && (
          <div className="px-3 py-2 border-t border-neutral-700 grid grid-cols-6 gap-1">
            {QUICK_EMOJIS.map((e) => (
              <button key={e} onClick={() => setMsgInput((p) => p + e)}
                className="text-lg hover:scale-125 transition-transform text-center">
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 pb-3 pt-2 border-t border-neutral-700 flex items-center gap-2">
          <button onClick={() => setShowEmoji((p) => !p)} className="text-neutral-400 hover:text-white transition">
            <FontAwesomeIcon icon={faSmile} />
          </button>
          <input
            type="text"
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500 transition"
          />
          <button onClick={sendMessage} className="text-slate-400 hover:text-white transition">
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-4">Report User</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe what happened…"
              className="w-full bg-neutral-700 border border-neutral-600 text-white text-sm rounded-xl px-3 py-2 resize-none h-24 focus:outline-none focus:border-slate-500 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)}
                className="flex-1 py-2 rounded-xl border border-neutral-600 text-neutral-300 text-sm hover:bg-neutral-700 transition">
                Cancel
              </button>
              <button onClick={handleReport}
                className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Btn = ({ icon, onClick, label, active, cls = "" }) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-white text-sm transition ${
      active ? "bg-red-700 hover:bg-red-600" : cls || "bg-neutral-700 hover:bg-neutral-600"
    }`}
  >
    <FontAwesomeIcon icon={icon} />
    <span className="text-[10px] hidden md:block">{label}</span>
  </button>
);