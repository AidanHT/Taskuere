import React, { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const SharedDocumentEditor = ({ appointmentId }) => {
  const ydoc = useMemo(() => new Y.Doc(), [appointmentId]);
  const provider = useMemo(() => {
    const url = process.env.REACT_APP_API_URL.replace(/^http/, 'ws');
    return new WebsocketProvider(`${url}/collab-sync`, `doc-${appointmentId}`, ydoc);
  }, [appointmentId, ydoc]);

  const ytext = useMemo(() => ydoc.getText('tiptap'), [ydoc]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    autofocus: true,
    onUpdate: ({ editor: ed }) => {
      // Local changes are automatically synced by tiptap-yjs alternative; here we are using ytext binding below
    },
  });

  useEffect(() => {
    if (!editor) return undefined;
    const updateFromY = () => {
      editor.commands.setContent(ytext.toString() || '<p></p>', false);
    };
    // Initialize from Y
    updateFromY();
    const observer = (event, transaction) => {
      updateFromY();
    };
    ytext.observe(observer);
    // Propagate from editor to Y
    const handleTrans = editor.on('transaction', () => {
      const json = editor.getText();
      ytext.delete(0, ytext.length);
      ytext.insert(0, json);
    });
    return () => {
      ytext.unobserve(observer);
      handleTrans();
      provider.destroy();
      editor.destroy();
      ydoc.destroy();
    };
  }, [editor, provider, ydoc, ytext]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <EditorContent editor={editor} style={{ flex: 1, border: '1px solid #e0e0e0', padding: 8 }} />
    </Box>
  );
};

export default SharedDocumentEditor;

