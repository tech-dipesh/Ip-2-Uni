import { useRef, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const useWebRTC = ({ socketRef, onConnectionStateChange }) => {
  const localStreamRef  = useRef(null);
  const peerRef         = useRef(null);
  const localVideoRef   = useRef(null);
  const remoteVideoRef  = useRef(null);

  const startLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, []);

  const buildPeer = useCallback((roomId) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    localStreamRef.current
      ?.getTracks()
      .forEach((track) => peer.addTrack(track, localStreamRef.current));

    peer.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("signal", {
          roomId,
          signal: { type: "ice-candidate", candidate: e.candidate },
        });
      }
    };

    peer.onconnectionstatechange = () =>
      onConnectionStateChange?.(peer.connectionState);

    peerRef.current = peer;
    return peer;
  }, [socketRef, onConnectionStateChange]);

  const initiateCall = useCallback(async (roomId) => {
    const peer  = buildPeer(roomId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current?.emit("signal", { roomId, signal: { type: "offer", sdp: offer } });
  }, [buildPeer, socketRef]);

  const handleSignal = useCallback(async ({ signal }, roomId) => {
    const peer = peerRef.current;

    if (signal.type === "offer") {
      const pc = buildPeer(roomId);
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit("signal", { roomId, signal: { type: "answer", sdp: answer } });
    } else if (signal.type === "answer" && peer) {
      await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    } else if (signal.type === "ice-candidate" && peer) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (err) {
        console.warn("[WebRTC] ICE candidate rejected:", err.message);
      }
    }
  }, [buildPeer, socketRef]);

  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
    return track?.enabled ?? true;
  }, []);

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
    return track?.enabled ?? true;
  }, []);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    peerRef.current        = null;
    localStreamRef.current = null;
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    startLocalStream,
    initiateCall,
    handleSignal,
    toggleAudio,
    toggleVideo,
    cleanup,
  };
};

export default useWebRTC;