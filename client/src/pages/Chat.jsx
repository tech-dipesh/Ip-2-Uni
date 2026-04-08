import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faPaperPlane, faSmile, faSpinner, faForward } from "@fortawesome/free-solid-svg-icons";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

const MOODS = [
  { id: "casual_chat", label: "Casual Chat", emoji: "💬" },
  { id: "study",       label: "Study",       emoji: "📚" },
  { id: "networking",  label: "Networking",  emoji: "🤝" },
];

const QUICK_EMOJIS = ["😀","😂","😍","🥺","😎","🤔","👍","❤️","🎉","🔥","👋","😮"];

export default function Chat() {
  const { user } = useSelector((s) => s.auth);

  const [stage, setStage]         = useState("onboarding");
  const [mood, setMood]           = useState("");
  const [messages, setMessages]   = useState([]);
  const [msgInput, setMsgInput]   = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [roomId, setRoomId]       = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

const socketRef = useRef(null);

useEffect(() => {
  socketRef.current = io(SOCKET_URL, {
    withCredentials: true,
    auth: { userId: user?.id || null },
  });

  return () => {
    socketRef.current?.disconnect();
  };
}, [user?.id]);

  const handleFind = () => {
    if (!mood) return;
    socketRef.current?.emit("find_match", { mood });
    setStage("waiting");
  };

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    const msg = { text: msgInput.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    socketRef.current?.emit("chat_message", { roomId, ...msg });
    setMessages((p) => [...p, { ...msg, self: true }]);
    setMsgInput("");
    setShowEmoji(false);
  };

  const handleSkip = () => {
    socketRef.current?.emit("skip", { roomId, mood });
    setMessages([]);
    setRoomId(null);
    setStage("waiting");
  };

  if (stage === "onboarding") return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-neutral-800 border border-neutral-700 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <FontAwesomeIcon icon={faComments} className="text-slate-400 text-xl" />
          <h2 className="text-white font-bold text-xl">Chat with a Stranger</h2>
        </div>

        <label className="text-neutral-300 text-sm font-medium block mb-3">Choose your mood</label>
        <div className="grid grid-cols-3 gap-3 mb-8">
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

        <button
          onClick={handleFind}
          disabled={!mood}
          className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition"
        >
          Start Chatting
        </button>
      </div>
    </div>
  );

  if (stage === "waiting") return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <FontAwesomeIcon icon={faSpinner} className="text-slate-400 text-4xl animate-spin mb-5" />
        <h3 className="text-white text-xl font-semibold mb-2">Looking for someone…</h3>
        <p className="text-neutral-400 text-sm mb-6">
          Mood: <span className="text-slate-400 capitalize">{mood.replace("_", " ")}</span>
        </p>
        <button onClick={() => setStage("onboarding")} className="text-neutral-500 hover:text-white text-sm transition">Cancel</button>
      </div>
    </div>
  );

  if (stage === "ended") return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">👋</div>
        <h3 className="text-white text-xl font-semibold mb-2">Chat ended</h3>
        <p className="text-neutral-400 text-sm mb-8">Find someone new?</p>
        <button
          onClick={() => { setStage("onboarding"); setMessages([]); setRoomId(null); }}
          className="px-7 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition"
        >
          New Chat
        </button>
      </div>
    </div>
  );

  // Connected
  return (
    <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto border-x border-neutral-800">
      <div className="px-4 py-3 border-b border-neutral-700 bg-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white text-sm font-medium">
            Connected · <span className="text-neutral-400 capitalize">{mood.replace("_", " ")}</span>
          </span>
        </div>
        <button onClick={handleSkip} className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-sm transition">
          <FontAwesomeIcon icon={faForward} />
          Skip
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-neutral-500 text-sm text-center mt-12">You're connected. Say hi! 👋</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}>
            <div className={`max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${msg.self ? "bg-slate-700 text-white" : "bg-neutral-700 text-neutral-200"}`}>
              {msg.text}
            </div>
            <span className="text-neutral-500 text-[10px] mt-1 px-1">{msg.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showEmoji && (
        <div className="px-4 py-2 border-t border-neutral-700 bg-neutral-800 grid grid-cols-8 gap-1">
          {QUICK_EMOJIS.map((e) => (
            <button key={e} onClick={() => setMsgInput((p) => p + e)}
              className="text-xl py-1 hover:scale-125 transition-transform text-center">
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-neutral-700 bg-neutral-800 flex items-center gap-3">
        <button onClick={() => setShowEmoji((p) => !p)} className="text-neutral-400 hover:text-white transition">
          <FontAwesomeIcon icon={faSmile} />
        </button>
        <input
          type="text"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message…"
          className="flex-1 bg-neutral-700 border border-neutral-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500 transition"
        />
        <button onClick={sendMessage} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-xl transition">
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
}