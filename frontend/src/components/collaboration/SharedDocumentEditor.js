import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const SharedDocumentEditor = ({ appointmentId }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    autofocus: true,
  });

  useEffect(() => {
    if (!editor) return undefined;
    const httpBase = process.env.REACT_APP_API_URL || window.location.origin.replace(/:\d+$/, ':5000');
    const wsUrl = httpBase.replace(/^http/, 'ws');
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(`${wsUrl}/collab-sync`, `doc-${appointmentId}`, ydoc);
    const ytext = ydoc.getText('tiptap');

    const renderFromY = () => {
      const content = ytext.toString();
      editor.commands.setContent(content || '<p></p>', false);
    };
    // Initialize from Y and subscribe to Y updates
    renderFromY();
    const yObserver = () => renderFromY();
    ytext.observe(yObserver);

    // Push local editor changes to Y
    const onEditorUpdate = () => {
      const plain = editor.getText();
      const current = ytext.toString();
      if (current !== plain) {
        ytext.delete(0, ytext.length);
        ytext.insert(0, plain);
      }
    };
    editor.on('update', onEditorUpdate);

    return () => {
      try { ytext.unobserve(yObserver); } catch (e) { /* noop */ }
      try { editor.off('update', onEditorUpdate); } catch (e) { /* noop */ }
      try { provider.destroy(); } catch (e) { /* noop */ }
      try { ydoc.destroy(); } catch (e) { /* noop */ }
    };
  }, [appointmentId, editor]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <EditorContent editor={editor} style={{ flex: 1, border: '1px solid #e0e0e0', padding: 8 }} />
    </Box>
  );
};

export default SharedDocumentEditor;

