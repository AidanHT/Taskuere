import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, MenuItem, Select, Stack, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const CollaborativeWhiteboard = ({ appointmentId, socket }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const strokesBufferRef = useRef([]);
  const [color, setColor] = useState('#222');
  const [lineWidth, setLineWidth] = useState(2);

  const drawStroke = useCallback((ctx, stroke) => {
    if (stroke.length < 2) return;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const sColor = stroke[0].c || color;
    const sWidth = stroke[0].w || lineWidth;
    ctx.strokeStyle = sColor;
    ctx.lineWidth = sWidth;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i += 1) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }, [color, lineWidth]);

  useEffect(() => {
    const s = socket.current;
    if (!s) return undefined;
    const handleDraw = ({ strokes }) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      strokes.forEach((stroke) => drawStroke(ctx, stroke));
    };
    const handleClear = () => {
      clearCanvas();
    };
    s.on('whiteboard:draw', handleDraw);
    s.on('whiteboard:clear', handleClear);
    return () => {
      s.off('whiteboard:draw', handleDraw);
      s.off('whiteboard:clear', handleClear);
    };
  }, [socket, drawStroke]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (strokesBufferRef.current.length > 0 && socket.current) {
        socket.current.emit('whiteboard:draw', {
          appointmentId,
          strokes: strokesBufferRef.current.splice(0, strokesBufferRef.current.length),
        });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [appointmentId, socket]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    const stroke = [{ x: offsetX, y: offsetY, c: color, w: lineWidth }];
    setCurrentStroke(stroke);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const stroke = [...currentStroke, { x: offsetX, y: offsetY, c: color, w: lineWidth }];
    setCurrentStroke(stroke);
    drawStroke(ctx, stroke.slice(-2));
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      strokesBufferRef.current.push(currentStroke);
      setCurrentStroke([]);
    }
  };

  const handleClearClick = () => {
    clearCanvas();
    socket.current?.emit('whiteboard:clear', { appointmentId });
  };

  const handleSaveSnapshot = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const png = canvas.toDataURL('image/png');
      // Optionally downscale or generate thumbnail here
      fetch(`${process.env.REACT_APP_API_URL}/api/collaboration/whiteboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ appointmentId, strokes: [], thumbnailPngBase64: png }),
      });
    } catch (_) { /* noop */ }
  };

  return (
    <Stack spacing={1} sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button size="small" variant="outlined" onClick={handleClearClick}>Clear</Button>
        <Tooltip title="Save snapshot">
          <IconButton size="small" onClick={handleSaveSnapshot}>
            <SaveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 32, height: 32, border: 'none', background: 'transparent' }} />
        <Select size="small" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))}>
          {[1,2,3,4,5,6,8,10].map((w) => (
            <MenuItem key={w} value={w}>{w}px</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ flex: 1, border: '1px solid #ddd', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
    </Stack>
  );
};

export default CollaborativeWhiteboard;

