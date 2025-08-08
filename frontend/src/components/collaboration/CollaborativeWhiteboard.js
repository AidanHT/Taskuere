import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';

const CollaborativeWhiteboard = ({ appointmentId, socket }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const strokesBufferRef = useRef([]);

  useEffect(() => {
    const s = socket.current;
    if (!s) return;
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
  }, [socket]);

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

  const drawStroke = (ctx, stroke) => {
    if (stroke.length < 2) return;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i += 1) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    const stroke = [{ x: offsetX, y: offsetY }];
    setCurrentStroke(stroke);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const stroke = [...currentStroke, { x: offsetX, y: offsetY }];
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

  return (
    <Stack spacing={1} sx={{ height: '100%' }}>
      <Box>
        <Button size="small" variant="outlined" onClick={handleClearClick}>Clear</Button>
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

