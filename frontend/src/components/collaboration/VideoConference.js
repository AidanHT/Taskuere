import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';

const VideoConference = ({ appointmentId, socket, participants }) => {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const [ready, setReady] = useState(false);
  // peers state removed, using refs for stability
  const peersRef = useRef({});
  const [streams, setStreams] = useState({}); // socketId -> MediaStream
  const streamsRef = useRef({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const screenTrackRef = useRef(null);

  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setReady(true);
      } catch (e) {
        // ignore for now
      }
    };
    start();

    const s = socket.current;
    if (!s) return undefined;

    const handleSignal = ({ from, signal }) => {
      const existing = peersRef.current[from];
      if (existing) {
        existing.signal(signal);
      } else if (localStreamRef.current) {
        const peer = new SimplePeer({ initiator: false, trickle: true, stream: localStreamRef.current });
        peer.on('signal', (sig) => s.emit('webrtc:signal', { appointmentId, targetSocketId: from, signal: sig }));
        peer.on('stream', (remoteStream) => {
          streamsRef.current = { ...streamsRef.current, [from]: remoteStream };
          setStreams(streamsRef.current);
        });
        peer.signal(signal);
        peersRef.current = { ...peersRef.current, [from]: peer };
      }
    };

    s.on('webrtc:signal', handleSignal);

    // Initiate connections to other participants (initial pass)
    participants.forEach((p) => {
      if (!localStreamRef.current) return;
      if (p.socketId === s.id) return;
      if (peersRef.current[p.socketId]) return;
      const peer = new SimplePeer({ initiator: true, trickle: true, stream: localStreamRef.current });
      peer.on('signal', (sig) => s.emit('webrtc:signal', { appointmentId, targetSocketId: p.socketId, signal: sig }));
      peer.on('stream', (remoteStream) => {
        streamsRef.current = { ...streamsRef.current, [p.socketId]: remoteStream };
        setStreams(streamsRef.current);
      });
      peersRef.current = { ...peersRef.current, [p.socketId]: peer };
    });

    return () => {
      s.off('webrtc:signal', handleSignal);
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [appointmentId, socket, participants]);

  // Manage initiating and pruning peers when participants or readiness changes
  useEffect(() => {
    const s = socket.current;
    if (!s || !ready) return;

    const currentIds = new Set(participants.map((p) => p.socketId).filter(Boolean));

    // Initiate connections to other participants
    participants.forEach((p) => {
      if (!localStreamRef.current) return;
      if (p.socketId === s.id) return;
      if (peersRef.current[p.socketId]) return;
      const peer = new SimplePeer({ initiator: true, trickle: true, stream: localStreamRef.current });
      peer.on('signal', (sig) => s.emit('webrtc:signal', { appointmentId, targetSocketId: p.socketId, signal: sig }));
      peer.on('stream', (remoteStream) => {
        streamsRef.current = { ...streamsRef.current, [p.socketId]: remoteStream };
        setStreams(streamsRef.current);
      });
      peersRef.current = { ...peersRef.current, [p.socketId]: peer };
    });

    // Prune disconnected peers
    Object.keys(peersRef.current).forEach((socketId) => {
      if (!currentIds.has(socketId)) {
        try { peersRef.current[socketId].destroy(); } catch (_) { /* noop */ }
        const { [socketId]: _, ...restPeers } = peersRef.current;
        peersRef.current = restPeers;
        const { [socketId]: __, ...restStreams } = streamsRef.current;
        streamsRef.current = restStreams;
        setStreams(streamsRef.current);
      }
    });
  }, [participants, ready, appointmentId, socket]);

  const toggleMic = () => {
    const stream = localVideoRef.current?.srcObject;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn(stream.getAudioTracks().some((t) => t.enabled));
  };

  const toggleCam = () => {
    const stream = localVideoRef.current?.srcObject;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn(stream.getVideoTracks().some((t) => t.enabled));
  };

  const toggleShare = async () => {
    try {
      if (!sharing) {
        const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenTrackRef.current = display.getVideoTracks()[0];
        // Replace video track for each peer
        Object.values(peersRef.current).forEach((peer) => {
          try {
            const senders = peer?._pc?.getSenders?.() || [];
            const sender = senders.find((s) => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(screenTrackRef.current);
          } catch (_) { /* noop */ }
        });
        setSharing(true);
        screenTrackRef.current.onended = () => {
          if (sharing) toggleShare();
        };
      } else {
        const stream = localVideoRef.current?.srcObject;
        const camTrack = stream?.getVideoTracks()[0];
        if (camTrack) {
          Object.values(peersRef.current).forEach((peer) => {
            try {
              const senders = peer?._pc?.getSenders?.() || [];
              const sender = senders.find((s) => s.track && s.track.kind === 'video');
              if (sender) sender.replaceTrack(camTrack);
            } catch (_) { /* noop */ }
          });
        }
        screenTrackRef.current?.stop();
        screenTrackRef.current = null;
        setSharing(false);
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <Stack spacing={1} sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '50%' }} />
        {Object.entries(streams).map(([socketId, stream]) => (
          <video key={socketId} autoPlay playsInline style={{ width: '50%' }} ref={(el) => el && (el.srcObject = stream)} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
        <Tooltip title={micOn ? 'Mute' : 'Unmute'}>
          <IconButton onClick={toggleMic} color={micOn ? 'primary' : 'default'}>
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={camOn ? 'Turn camera off' : 'Turn camera on'}>
          <IconButton onClick={toggleCam} color={camOn ? 'primary' : 'default'}>
            {camOn ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={sharing ? 'Stop sharing' : 'Share screen'}>
          <IconButton onClick={toggleShare} color={sharing ? 'primary' : 'default'}>
            {sharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Stack>
  );
};

export default VideoConference;

