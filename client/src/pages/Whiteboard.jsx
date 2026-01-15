import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket, useSocketStatus } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Whiteboard() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const isConnected = useSocketStatus();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const currentRoomRef = useRef(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [boardTitle, setBoardTitle] = useState("Design Sprint Board");
  const [activeTool, setActiveTool] = useState("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [userInitials, setUserInitials] = useState([]);
  const strokeHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const EMIT_THROTTLE_MS = 16; // 60fps for smooth drawing

  // Initialize canvas with dark theme and grid
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // Draw grid background
    drawGrid(ctx, canvas.width / dpr, canvas.height / dpr);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    ctxRef.current = ctx;
  }, []);

  // Draw grid background
  const drawGrid = useCallback((ctx, width, height) => {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;

    const gridSize = 20;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  // Redraw grid when zoom changes
  useEffect(() => {
    if (!ctxRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Redraw grid
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, width, height);
  }, [zoom, drawGrid]);

  // Smooth stroke drawing
  const drawSmoothStroke = useCallback((points, ctx, color = "#ffffff", width = 2) => {
    if (!points || points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
      return;
    }

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

  // Join room and handle reconnection
  useEffect(() => {
    if (!socket || !roomId || !isConnected) return;

    console.log("Joining whiteboard room:", roomId);
    currentRoomRef.current = roomId;
    socket.emit("join_whiteboard", roomId);

    return () => {
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

  // Handle room state
  useEffect(() => {
    if (!socket) return;

    const handleRoomJoined = (data) => {
      console.log("Room joined:", data);
      setParticipantCount(data.participantCount || 1);
      setUserInitials(["JD", "SV", "MJ"].slice(0, data.participantCount || 1));

      // Draw recent strokes if available
      if (data.recentStrokes && data.recentStrokes.length > 0 && ctxRef.current) {
        requestAnimationFrame(() => {
          data.recentStrokes.forEach((stroke) => {
            if (stroke.points && ctxRef.current) {
              drawSmoothStroke(
                stroke.points,
                ctxRef.current,
                stroke.strokeStyle,
                stroke.lineWidth
              );
            }
          });
        });
      }
    };

    const handleUserJoined = (data) => {
      console.log("User joined:", data);
      setParticipantCount(data.participantCount || participantCount + 1);
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

  // Receive remote draw events
  useEffect(() => {
    if (!socket || !ctxRef.current) return;

    const handleRemoteDraw = (data) => {
      if (data.senderId === socket.id) return;

      if (!ctxRef.current || !data.points || data.points.length < 2) return;

      requestAnimationFrame(() => {
        if (ctxRef.current) {
          drawSmoothStroke(
            data.points,
            ctxRef.current,
            data.strokeStyle || "#ffffff",
            data.lineWidth || 2
          );
        }
      });
    };

    const handleClear = (data) => {
      if (data.senderId === socket.id) return;

      if (!ctxRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(ctx, rect.width, rect.height);
      strokeHistoryRef.current = [];
      historyIndexRef.current = -1;
    };

    socket.on("draw_event", handleRemoteDraw);
    socket.on("clear_event", handleClear);

    return () => {
      socket.off("draw_event", handleRemoteDraw);
      socket.off("clear_event", handleClear);
    };
  }, [socket, drawSmoothStroke, drawGrid]);

  // Canvas drawing handlers
  const getPointFromEvent = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: (clientX - rect.left - panOffset.x) * (100 / zoom),
      y: (clientY - rect.top - panOffset.y) * (100 / zoom),
    };
  }, [panOffset, zoom]);

  const currentStrokeRef = useRef([]);

  const handleMouseDown = useCallback((e) => {
    if (activeTool !== "pen") return;

    const point = getPointFromEvent(e);
    if (!point) return;

    setIsDrawing(true);
    currentStrokeRef.current = [point];
  }, [activeTool, getPointFromEvent]);

  const handleMouseMove = useCallback((e) => {
    if (activeTool === "hand" && isPanning) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

      const deltaX = clientX - lastPanPoint.x;
      const deltaY = clientY - lastPanPoint.y;

      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setLastPanPoint({ x: clientX, y: clientY });
      return;
    }

    if (!isDrawing || activeTool !== "pen") return;

    const point = getPointFromEvent(e);
    if (!point || !ctxRef.current) return;

    currentStrokeRef.current.push(point);

    // Draw locally
    if (currentStrokeRef.current.length >= 2) {
      drawSmoothStroke(
        currentStrokeRef.current.slice(-2),
        ctxRef.current,
        "#ffffff",
        2
      );
    }

    // Emit to server (throttled)
    const now = Date.now();
    if (now - lastEmitTimeRef.current >= EMIT_THROTTLE_MS && socket && roomId) {
      lastEmitTimeRef.current = now;
      socket.emit("draw_event", {
        roomId,
        points: currentStrokeRef.current,
        strokeStyle: "#ffffff",
        lineWidth: 2,
      });
    }
  }, [isDrawing, activeTool, isPanning, getPointFromEvent, drawSmoothStroke, socket, roomId, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    if (activeTool === "hand") {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentStrokeRef.current.length > 1) {
      // Save to history for undo
      const strokeCopy = [...currentStrokeRef.current];
      strokeHistoryRef.current = strokeHistoryRef.current.slice(0, historyIndexRef.current + 1);
      strokeHistoryRef.current.push({
        points: strokeCopy,
        strokeStyle: "#ffffff",
        lineWidth: 2,
      });
      historyIndexRef.current = strokeHistoryRef.current.length - 1;
    }

    setIsDrawing(false);
    currentStrokeRef.current = [];
  }, [isDrawing, activeTool]);

  const handlePanStart = useCallback((e) => {
    if (activeTool !== "hand") return;
    setIsPanning(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    setLastPanPoint({ x: clientX, y: clientY });
  }, [activeTool]);

  // Clear canvas
  const handleClear = useCallback(() => {
    if (!socket || !roomId || !ctxRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, rect.width, rect.height);

    strokeHistoryRef.current = [];
    historyIndexRef.current = -1;

    socket.emit("clear_event", { roomId });
  }, [socket, roomId, drawGrid]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current < 0 || !ctxRef.current || !canvasRef.current) return;

    // Redraw everything except last stroke
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, rect.width, rect.height);

    historyIndexRef.current--;
    for (let i = 0; i <= historyIndexRef.current; i++) {
      const stroke = strokeHistoryRef.current[i];
      if (stroke) {
        drawSmoothStroke(stroke.points, ctx, stroke.strokeStyle, stroke.lineWidth);
      }
    }
  }, [drawGrid, drawSmoothStroke]);

  const handleRedo = useCallback(() => {
    if (
      historyIndexRef.current >= strokeHistoryRef.current.length - 1 ||
      !ctxRef.current ||
      !canvasRef.current
    )
      return;

    historyIndexRef.current++;
    const stroke = strokeHistoryRef.current[historyIndexRef.current];
    if (stroke && ctxRef.current) {
      drawSmoothStroke(stroke.points, ctxRef.current, stroke.strokeStyle, stroke.lineWidth);
    }
  }, [drawSmoothStroke]);

  // Export canvas
  const handleExport = useCallback(() => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, [roomId]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 10, 50));
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#0f172a",
        display: "flex",
        flexDirection: "column",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          backgroundColor: "#030712",
          borderBottom: "1px solid #1f2937",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              border: "none",
              color: "#e5e7eb",
              cursor: "pointer",
              fontSize: 20,
              padding: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            ←
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: "#e5e7eb",
            }}
          >
            {boardTitle}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              backgroundColor: "#22c55e",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              color: "#ffffff",
            }}
          >
            <span>📶</span>
            <span>Connected</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              backgroundColor: "#1f2937",
              borderRadius: 20,
              fontSize: 12,
            }}
          >
            {userInitials.map((init, idx) => (
              <div
                key={idx}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: "#374151",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {init}
              </div>
            ))}
          </div>

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            {participantCount}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Toolbar */}
        <aside
          style={{
            width: 56,
            backgroundColor: "#030712",
            borderRight: "1px solid #1f2937",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "12px 0",
            gap: 8,
          }}
        >
          {/* Pen Tool (Active) */}
          <button
            onClick={() => setActiveTool("pen")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "none",
              backgroundColor: activeTool === "pen" ? "#2563eb" : "transparent",
              color: activeTool === "pen" ? "#ffffff" : "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
            title="Pen"
          >
            ✏️
          </button>

          {/* Sticky Note */}
          <button
            onClick={() => setActiveTool("sticky")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "none",
              backgroundColor: activeTool === "sticky" ? "#2563eb" : "transparent",
              color: activeTool === "sticky" ? "#ffffff" : "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
            title="Sticky Note"
          >
            📄
          </button>

          {/* Hand Tool (Pan) */}
          <button
            onClick={() => setActiveTool("hand")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "none",
              backgroundColor: activeTool === "hand" ? "#2563eb" : "transparent",
              color: activeTool === "hand" ? "#ffffff" : "#9ca3af",
              cursor: activeTool === "hand" ? "grab" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
            title="Hand (Pan)"
          >
            ✋
          </button>

          {/* Arrow Pointer (Select) */}
          <button
            onClick={() => setActiveTool("arrow")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "none",
              backgroundColor: activeTool === "arrow" ? "#2563eb" : "transparent",
              color: activeTool === "arrow" ? "#ffffff" : "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
            title="Select"
          >
            ➡️
          </button>

          <div
            style={{
              width: "80%",
              height: 1,
              backgroundColor: "#1f2937",
              margin: "8px 0",
            }}
          />

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={historyIndexRef.current < 0}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "none",
              backgroundColor: "transparent",
              color: historyIndexRef.current >= 0 ? "#9ca3af" : "#475569",
              cursor: historyIndexRef.current >= 0 ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
            title="Undo"
          >
            ↶
          </button>

          {/* Redo */}
          <button
            onClick={handleRedo}
            disabled={historyIndexRef.current >= strokeHistoryRef.current.length - 1}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "none",
              backgroundColor: "transparent",
              color:
                historyIndexRef.current < strokeHistoryRef.current.length - 1
                  ? "#9ca3af"
                  : "#475569",
              cursor:
                historyIndexRef.current < strokeHistoryRef.current.length - 1
                  ? "pointer"
                  : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
            title="Redo"
          >
            ↷
          </button>
        </aside>

        {/* Canvas Area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#0f172a",
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={(e) => {
              if (activeTool === "hand") {
                handlePanStart(e);
              } else {
                handleMouseDown(e);
              }
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              if (activeTool === "hand") {
                handlePanStart(e);
              } else {
                handleMouseDown(e);
              }
            }}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            style={{
              width: "100%",
              height: "100%",
              cursor: activeTool === "pen" ? "crosshair" : activeTool === "hand" ? "grab" : "default",
              touchAction: "none",
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
              transformOrigin: "0 0",
            }}
          />
        </div>
      </div>

      {/* Bottom Control Bar */}
      <footer
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          backgroundColor: "#030712",
          borderTop: "1px solid #1f2937",
        }}
      >
        {/* Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleZoomOut}
            style={{
              background: "transparent",
              border: "1px solid #374151",
              color: "#e5e7eb",
              cursor: "pointer",
              width: 32,
              height: 32,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            −
          </button>
          <span style={{ fontSize: 14, color: "#e5e7eb", minWidth: 50, textAlign: "center" }}>
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            style={{
              background: "transparent",
              border: "1px solid #374151",
              color: "#e5e7eb",
              cursor: "pointer",
              width: 32,
              height: 32,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            +
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleExport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #374151",
              color: "#e5e7eb",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            <span>⬇️</span>
            <span>Export</span>
          </button>
          <button
            onClick={handleClear}
            disabled={!isConnected}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #374151",
              color: isConnected ? "#e5e7eb" : "#6b7280",
              borderRadius: 6,
              cursor: isConnected ? "pointer" : "not-allowed",
              fontSize: 14,
            }}
          >
            <span>🗑️</span>
            <span>Clear</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
