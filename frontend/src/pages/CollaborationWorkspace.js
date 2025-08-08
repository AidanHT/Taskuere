import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Box, Grid, Paper } from '@mui/material';
import ParticipantPanel from '../components/ParticipantPanel';
import CollaborativeWhiteboard from '../components/collaboration/CollaborativeWhiteboard';
import SharedDocumentEditor from '../components/collaboration/SharedDocumentEditor';
import VideoConference from '../components/collaboration/VideoConference';
import { useAuth } from '../context/AuthContext';

const CollaborationWorkspace = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const socketRef = useRef(null);

  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // Ensure collaboration room and document metadata exist
    const ensureResources = async () => {
      try {
        await axios.post(`${apiUrl}/api/collaboration/rooms`, { appointmentId });
        await axios.post(`${apiUrl}/api/collaboration/documents`, { appointmentId, type: 'tiptap' });
      } catch (e) {
        // ignore for now
      }
    };
    ensureResources();
    const url = apiUrl.replace(/^http/, 'ws');
    const socket = io(`${apiUrl}/collab`, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('room:join', { appointmentId, displayName: user?.username || 'User' });
    });
    socket.on('participants:update', (list) => {
      setParticipants(list);
    });
    socket.on('room:full', () => {
      navigate('/calendar');
    });
    return () => {
      socket.emit('room:leave', { appointmentId });
      socket.disconnect();
    };
  }, [apiUrl, appointmentId, navigate, token, user]);

  return (
    <Box sx={{ height: 'calc(100vh - 100px)' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={9} sx={{ height: '100%' }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} md={7} sx={{ height: { xs: '50%', md: '100%' } }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <CollaborativeWhiteboard appointmentId={appointmentId} socket={socketRef} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={5} sx={{ height: { xs: '50%', md: '100%' } }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <SharedDocumentEditor appointmentId={appointmentId} />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={3} sx={{ height: '100%' }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} sx={{ height: '50%' }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <VideoConference appointmentId={appointmentId} socket={socketRef} participants={participants} />
              </Paper>
            </Grid>
            <Grid item xs={12} sx={{ height: '50%' }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <ParticipantPanel participants={participants} />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CollaborationWorkspace;

