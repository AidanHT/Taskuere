import React from 'react';
import { List, ListItem, ListItemText, Avatar, ListItemAvatar, Typography } from '@mui/material';

const ParticipantPanel = ({ participants }) => {
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Participants
      </Typography>
      <List>
        {participants?.map((p) => (
          <ListItem key={p.socketId}>
            <ListItemAvatar>
              <Avatar>{p.displayName?.[0]?.toUpperCase() || '?'}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={p.displayName || 'User'} secondary={p.userId} />
          </ListItem>
        ))}
        {(!participants || participants.length === 0) && (
          <Typography variant="body2" color="text.secondary">
            No participants yet.
          </Typography>
        )}
      </List>
    </div>
  );
};

export default ParticipantPanel;

