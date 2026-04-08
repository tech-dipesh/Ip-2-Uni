import { useDispatch, useSelector } from "react-redux";
import {BrowserRouter, Route, Routes} from "react-router"
import Header from "./components/Header";
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Video from "./pages/Video"
import Chat from "./pages/Chat"
import Profile from "./pages/Profile"
import "./App.css"
import { useEffect } from "react";
import { fetchCurrentUser } from "./features/auth/authSlice";
export default function App() {
  const dispatch = useDispatch();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/video" element={<Video />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}