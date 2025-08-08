import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { Box } from '@mui/material';

const VideoConference = ({ appointmentId, socket, participants }) => {
  const localVideoRef = useRef(null);
  const [peers, setPeers] = useState({}); // socketId -> peer
  const [streams, setStreams] = useState({}); // socketId -> MediaStream

  useEffect(() => {
    let localStream;
    const start = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      } catch (e) {
        // ignore for now
      }
    };
    start();

    const s = socket.current;
    if (!s) return undefined;

    const handleSignal = ({ from, signal }) => {
      const existing = peers[from];
      if (existing) {
        existing.signal(signal);
      } else if (localStream) {
        const peer = new SimplePeer({ initiator: false, trickle: true, stream: localStream });
        peer.on('signal', (sig) => s.emit('webrtc:signal', { appointmentId, targetSocketId: from, signal: sig }));
        peer.on('stream', (remoteStream) => setStreams((prev) => ({ ...prev, [from]: remoteStream })));
        peer.signal(signal);
        setPeers((prev) => ({ ...prev, [from]: peer }));
      }
    };

    s.on('webrtc:signal', handleSignal);

    // Initiate connections to other participants
    participants.forEach((p) => {
      if (!localStream) return;
      if (p.socketId === s.id) return;
      if (peers[p.socketId]) return;
      const peer = new SimplePeer({ initiator: true, trickle: true, stream: localStream });
      peer.on('signal', (sig) => s.emit('webrtc:signal', { appointmentId, targetSocketId: p.socketId, signal: sig }));
      peer.on('stream', (remoteStream) => setStreams((prev) => ({ ...prev, [p.socketId]: remoteStream })));
      setPeers((prev) => ({ ...prev, [p.socketId]: peer }));
    });

    return () => {
      s.off('webrtc:signal', handleSignal);
      Object.values(peers).forEach((peer) => peer.destroy());
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, [appointmentId, participants, peers, socket]);

  return (
    <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
      <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '50%' }} />
      {Object.entries(streams).map(([socketId, stream]) => (
        <video key={socketId} autoPlay playsInline style={{ width: '50%' }} ref={(el) => el && (el.srcObject = stream)} />
      ))}
    </Box>
  );
};

export default VideoConference;

