import { useEffect, useRef, useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket, useSocketStatus } from "../context/SocketContext";
import CanvasBoard from "../components/CanvasBoard";

export default function Whiteboard() {
  const { roomId } = useParams();
  const socket = useSocket();
  const isConnected = useSocketStatus();

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const currentRoomRef = useRef(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [showStatus, setShowStatus] = useState(true);

  // Optimized throttle rate for 5+ users
  const EMIT_THROTTLE_MS = 50; // Slightly increased from 16ms for better server handling

  /* ---------------- SETUP CONTEXT ---------------- */
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2d3436";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 1;
    ctx.shadowColor = "#2d3436";

    ctxRef.current = ctx;
  }, []);

  /* ---------------- SMOOTH STROKE DRAWING ---------------- */
  const drawSmoothStroke = useCallback((points, ctx) => {
    if (!points || points.length < 2) return;

    if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
      return;
    }

    // Draw smooth curves
    for (let i = 0; i < points.length - 2; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const p2 = points[i + 2];

      const xc1 = (p0.x + p1.x) / 2;
      const yc1 = (p0.y + p1.y) / 2;
      const xc2 = (p1.x + p2.x) / 2;
      const yc2 = (p1.y + p2.y) / 2;

      ctx.beginPath();
      ctx.moveTo(xc1, yc1);
      ctx.quadraticCurveTo(p1.x, p1.y, xc2, yc2);
      ctx.stroke();
    }
  }, []);

  /* ---------------- JOIN ROOM & HANDLE RECONNECTION ---------------- */
  useEffect(() => {
    if (!socket || !roomId || !isConnected) return;

    console.log("Joining whiteboard room:", roomId);
    currentRoomRef.current = roomId;
    socket.emit("join_whiteboard", roomId);

    // Hide status indicator after 3 seconds
    const timer = setTimeout(() => setShowStatus(false), 3000);

    return () => {
      clearTimeout(timer);
      if (currentRoomRef.current) {
        socket.emit("leave_whiteboard", currentRoomRef.current);
        currentRoomRef.current = null;
      }
      socket.off("draw_event");
      socket.off("clear_event");
      socket.off("room_joined");
      socket.off("user_joined_whiteboard");
      socket.off("user_left_whiteboard");
    };
  }, [socket, roomId, isConnected]);

  /* ---------------- HANDLE ROOM STATE ---------------- */
  useEffect(() => {
    if (!socket) return;

    const handleRoomJoined = (data) => {
      console.log("Room joined:", data);
      setParticipantCount(data.participantCount || 1);

      // Draw recent strokes if available (for late joiners)
      if (data.recentStrokes && data.recentStrokes.length > 0 && ctxRef.current) {
        requestAnimationFrame(() => {
          data.recentStrokes.forEach((stroke) => {
            if (stroke.points && ctxRef.current) {
              drawSmoothStroke(stroke.points, ctxRef.current);
            }
          });
        });
      }
    };

    const handleUserJoined = (data) => {
      console.log("User joined:", data);
      setParticipantCount(data.participantCount || participantCount + 1);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleUserLeft = (data) => {
      console.log("User left:", data);
      setParticipantCount(data.participantCount || Math.max(1, participantCount - 1));
    };

    socket.on("room_joined", handleRoomJoined);
    socket.on("user_joined_whiteboard", handleUserJoined);
    socket.on("user_left_whiteboard", handleUserLeft);

    return () => {
      socket.off("room_joined", handleRoomJoined);
      socket.off("user_joined_whiteboard", handleUserJoined);
      socket.off("user_left_whiteboard", handleUserLeft);
    };
  }, [socket, drawSmoothStroke, participantCount]);

  /* ---------------- RECEIVE REMOTE DRAW EVENTS ---------------- */
  useEffect(() => {
    if (!socket || !ctxRef.current) return;

    const handleRemoteDraw = (data) => {
      // Skip own drawings
      if (data.senderId === socket.id) {
        return;
      }

      if (!ctxRef.current || !data.points || data.points.length < 2) return;

      const ctx = ctxRef.current;

      // Apply stroke style
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = data.strokeStyle || "#2d3436";
      ctx.lineWidth = data.lineWidth || 3;
      ctx.shadowBlur = 1;
      ctx.shadowColor = data.strokeStyle || "#2d3436";

      // Use RAF for smooth rendering
      requestAnimationFrame(() => {
        if (ctxRef.current) {
          drawSmoothStroke(data.points, ctxRef.current);
        }
      });
    };

    const handleClear = (data) => {
      // Skip if we initiated the clear
      if (data.senderId === socket.id) {
        return;
      }

      if (!ctxRef.current || !canvasRef.current) return;
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    socket.on("draw_event", handleRemoteDraw);
    socket.on("clear_event", handleClear);

    return () => {
      socket.off("draw_event", handleRemoteDraw);
      socket.off("clear_event", handleClear);
    };
  }, [socket, drawSmoothStroke]);

  /* ---------------- SEND DRAW EVENTS (Optimized) ---------------- */
  const handleDraw = useCallback(
    (points) => {
      if (!socket || !roomId || !points || points.length < 2) return;

      const now = Date.now();

      // Throttle emissions for better performance with multiple users
      if (now - lastEmitTimeRef.current < EMIT_THROTTLE_MS) {
        return;
      }

      lastEmitTimeRef.current = now;
      const drawData = {
        roomId,
        points,
        strokeStyle: "#2d3436",
        lineWidth: 3,
      };

      socket.emit("draw_event", drawData);
    },
    [socket, roomId]
  );

  /* ---------------- CLEAR CANVAS HANDLER ---------------- */
  const handleClear = useCallback(() => {
    if (!socket || !roomId || !ctxRef.current || !canvasRef.current) return;

    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket.emit("clear_event", { roomId });
  }, [socket, roomId]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f5f6fa",
        position: "relative",
      }}
    >
      {/* Connection & Participant Status */}
      {showStatus && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 10,
            backgroundColor: isConnected ? "#27ae60" : "#e74c3c",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "opacity 0.3s",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "white",
              animation: isConnected ? "pulse 2s infinite" : "none",
            }}
          />
          {isConnected
            ? `${participantCount} ${participantCount === 1 ? "user" : "users"} online`
            : "Disconnected"}
        </div>
      )}

      {/* Clear Button */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
        }}
      >
        <button
          onClick={handleClear}
          disabled={!isConnected}
          style={{
            padding: "8px 16px",
            backgroundColor: isConnected ? "#e74c3c" : "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isConnected ? "pointer" : "not-allowed",
            fontSize: "14px",
            fontWeight: "500",
            opacity: isConnected ? 1 : 0.6,
          }}
        >
          Clear Canvas
        </button>
      </div>

      <CanvasBoard canvasRef={canvasRef} onDraw={handleDraw} onClear={handleClear} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
