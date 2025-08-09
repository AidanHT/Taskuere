import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Box, IconButton, InputAdornment, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatPanel = ({ appointmentId, socket, displayName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const listRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_URL || window.location.origin.replace(/:\d+$/, ':5000');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${apiUrl}/api/collaboration/chat/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 100 },
        });
        setMessages(res.data || []);
      } catch (e) {
        // ignore
      }
    };
    fetchHistory();
  }, [apiUrl, appointmentId]);

  useEffect(() => {
    const s = socket.current;
    if (!s) return undefined;
    const handleIncoming = (payload) => {
      setMessages((prev) => [...prev, payload]);
      listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
    };
    s.on('chat:message', handleIncoming);
    return () => s.off('chat:message', handleIncoming);
  }, [socket]);

  const send = () => {
    if (!input.trim()) return;
    socket.current?.emit('chat:message', { appointmentId, content: input.trim(), displayName });
    setInput('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Chat
      </Typography>
      <Box sx={{ flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
        <List dense ref={listRef}>
          {messages.map((m) => (
            <ListItem key={m._id || `${m.sender}-${m.createdAt}`} alignItems="flex-start">
              <ListItemText
                primary={m.senderDisplayName || 'User'}
                secondary={
                  <>
                    <Typography variant="body2" color="textPrimary">{m.content}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(m.createdAt).toLocaleTimeString()}</Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ mt: 1 }}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          fullWidth
          size="small"
          placeholder="Type a message"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={send} edge="end" aria-label="send">
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
    </Box>
  );
};

export default ChatPanel;

