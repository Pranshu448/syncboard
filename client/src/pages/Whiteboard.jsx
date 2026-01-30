import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSocket, useSocketStatus } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Pencil, Eraser, Download, Trash2, Undo, Redo, Wifi, MousePointer2, User as UserIcon, X } from "lucide-react";

const THEME_COLORS = {
  dark: {
    background: "#0f172a",
    grid: "#1e293b",
    uiBg: "#030712",
    uiBorder: "#1f2937",
    textPrimary: "#e5e7eb",
    textSecondary: "#9ca3af",
    buttonBg: "#1f2937",
    buttonHover: "#374151"
  },
  light: {
    background: "#ffffff",
    grid: "#e2e8f0",
    uiBg: "#f8fafc",
    uiBorder: "#cbd5e1",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    buttonBg: "#e2e8f0",
    buttonHover: "#cbd5e1"
  }
};

export default function Whiteboard() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const isConnected = useSocketStatus();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
  const location = useLocation(); // Add hook

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const currentRoomRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [showUserList, setShowUserList] = useState(false);

  const [participantCount, setParticipantCount] = useState(1);
  const [boardTitle, setBoardTitle] = useState(location.state?.sessionName || "Design Sprint Board"); // Use state name
  const [activeTool, setActiveTool] = useState("pen");
  const [penColor, setPenColor] = useState(isDark ? "#ffffff" : "#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [userInitials, setUserInitials] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Navigation State
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  const strokesRef = useRef([]);
  const myStrokeIdsRef = useRef([]);
  const redoStackRef = useRef([]);
  const currentStrokeIdRef = useRef(null);
  const currentStrokeRef = useRef([]);

  const EMIT_THROTTLE_MS = 16;

  // Update pen color when theme changes if using defaults
  useEffect(() => {
    setPenColor(prevColor => {
      if (isDark && prevColor === "#000000") return "#ffffff";
      if (!isDark && prevColor === "#ffffff") return "#000000";
      return prevColor;
    });
  }, [isDark]);

  // Draw grid helper
  const drawGrid = useCallback((ctx, width, height, scale, pan) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1 / scale;

    const gridSize = 20;

    // Visible bounds in world coords
    const startX = -pan.x / scale;
    const startY = -pan.y / scale;
    const endX = startX + width / scale;
    const endY = startY + height / scale;

    const gridStartX = Math.floor(startX / gridSize) * gridSize;
    const gridStartY = Math.floor(startY / gridSize) * gridSize;

    ctx.beginPath();
    for (let x = gridStartX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = gridStartY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }, [colors]);

  // Smooth stroke drawing
  const drawSmoothStroke = useCallback((points, ctx, color = "#ffffff", width = 2) => {
    if (!points || points.length < 2) return;

    // Smart Color Inversion for Visibility
    let renderColor = color;
    if (isDark && color === "#000000") renderColor = "#ffffff";
    if (!isDark && color === "#ffffff") renderColor = "#000000";

    ctx.strokeStyle = renderColor;
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

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }, [isDark]);

  // Redraw Canvas
  const redrawCanvas = useCallback(() => {
    if (!ctxRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Clear (Reset Transform)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = zoom / 100;

    // Apply Transform (Scale + Pan)
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, panOffset.x * dpr, panOffset.y * dpr);

    // Grid (drawGrid uses setTransform internally for bg, uses context for lines)
    drawGrid(ctx, canvas.width, canvas.height, dpr * scale, { x: panOffset.x * dpr, y: panOffset.y * dpr });

    // Strokes
    strokesRef.current.forEach(stroke => {
      if (stroke.points && stroke.points.length > 0) {
        drawSmoothStroke(stroke.points, ctx, stroke.strokeStyle, stroke.lineWidth);
      }
    });
  }, [zoom, panOffset, drawGrid, drawSmoothStroke]);

  // Update Undo/Redo UI & Navigation
  const updateUndoRedoState = useCallback(() => {
    setCanUndo(myStrokeIdsRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  // Space Key Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && !e.repeat && e.target.tagName !== 'INPUT') {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === "Space") setIsSpacePressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Infinite Canvas Wheel Listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Pinch Zoom
        const zoomSpeed = 0.5;
        const delta = -e.deltaY * zoomSpeed;
        setZoom(z => Math.max(10, Math.min(500, z + delta)));
      } else {
        // Pan
        setPanOffset(p => ({
          x: p.x - e.deltaX,
          y: p.y - e.deltaY
        }));
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  // Sync Redraw
  useEffect(() => {
    redrawCanvas();
  }, [zoom, panOffset, redrawCanvas, theme]);

  // Init Sizing
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctxRef.current = canvas.getContext("2d");
      redrawCanvas();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [redrawCanvas]);

  // Socket Room
  useEffect(() => {
    if (!socket || !roomId || !isConnected) return;

    currentRoomRef.current = roomId;
    socket.emit("join_whiteboard", roomId);

    return () => {
      if (currentRoomRef.current) socket.emit("leave_whiteboard", currentRoomRef.current);
      socket.off("draw_event");
      socket.off("clear_event");
      socket.off("room_joined");
      socket.off("user_joined_whiteboard");
      socket.off("user_left_whiteboard");
      socket.off("erase_stroke");
    };
  }, [socket, roomId, isConnected]);

  // Socket Events
  useEffect(() => {
    if (!socket || !ctxRef.current) return;

    const handleRoomJoined = (data) => {
      setParticipantCount(data.participantCount || 1);
      if (data.users) {
        setUsers(data.users);
      }
      if (data.recentStrokes) {
        strokesRef.current = data.recentStrokes;
        redrawCanvas();
      }
    };

    const handleUserJoined = (data) => {
      setParticipantCount(data.participantCount);
      setUsers(prev => {
        if (prev.some(u => u.socketId === data.socketId)) return prev;
        return [...prev, {
          socketId: data.socketId,
          userId: data.userId,
          username: data.username,
          color: data.color
        }];
      });
    };

    const handleUserLeft = (data) => {
      setParticipantCount(data.participantCount);
      setUsers(prev => prev.filter(u => u.socketId !== data.socketId));
      setCursors(prev => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
    };

    const handleRemoteDraw = (data) => {
      if (data.senderId === socket.id) return;
      strokesRef.current.push({
        id: data.id || `remote-${Date.now()}-${Math.random()}`,
        points: data.points,
        strokeStyle: data.strokeStyle,
        lineWidth: data.lineWidth
      });
      requestAnimationFrame(() => {
        if (ctxRef.current) {
          drawSmoothStroke(data.points, ctxRef.current, data.strokeStyle, data.lineWidth);
        }
      });
    };

    const handleCursorMove = (data) => {
      if (data.socketId === socket.id) return;
      setCursors(prev => ({
        ...prev,
        [data.socketId]: { x: data.x, y: data.y, color: users.find(u => u.socketId === data.socketId)?.color || "#ff0000" }
      }));
    };

    const handleEraseStroke = (data) => {
      strokesRef.current = strokesRef.current.filter(s => s.id !== data.strokeId);
      redrawCanvas();
    };

    const handleClear = (data) => {
      if (data.senderId === socket.id) return;
      strokesRef.current = [];
      myStrokeIdsRef.current = [];
      redrawCanvas();
      updateUndoRedoState();
    };

    socket.on("room_joined", handleRoomJoined);
    socket.on("user_joined_whiteboard", handleUserJoined);
    socket.on("user_left_whiteboard", handleUserLeft);
    socket.on("user_cursor_move", handleCursorMove);
    socket.on("draw_event", handleRemoteDraw);
    socket.on("clear_event", handleClear);
    socket.on("erase_stroke", handleEraseStroke);

    return () => {
      socket.off("room_joined", handleRoomJoined);
      socket.off("user_joined_whiteboard", handleUserJoined);
      socket.off("user_left_whiteboard", handleUserLeft);
      socket.off("user_cursor_move", handleCursorMove);
      socket.off("draw_event", handleRemoteDraw);
      socket.off("clear_event", handleClear);
      socket.off("erase_stroke", handleEraseStroke);
    };
  }, [socket, redrawCanvas, drawSmoothStroke, updateUndoRedoState, users]);

  // Helpers
  const getPointFromEvent = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    // Inverse Transform
    const scale = zoom / 100;
    const worldX = (screenX - panOffset.x) / scale;
    const worldY = (screenY - panOffset.y) / scale;

    return { x: worldX, y: worldY };
  }, [panOffset, zoom]);

  const distanceToSegment = (p, v, w) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return (p.x - v.x - t * (w.x - v.x)) ** 2 + (p.y - v.y - t * (w.y - v.y)) ** 2;
  };

  const eraseStrokeAt = useCallback((point) => {
    const scale = zoom / 100;
    const worldThresholdSq = (10 / scale) ** 2;

    let erased = false;
    const toRemove = [];

    strokesRef.current.forEach(stroke => {
      if (!stroke.points) return;
      for (let i = 0; i < stroke.points.length - 1; i++) {
        const distSq = distanceToSegment(point, stroke.points[i], stroke.points[i + 1]);
        if (distSq < worldThresholdSq) {
          toRemove.push(stroke.id);
          erased = true;
          break;
        }
      }
    });

    if (erased) {
      strokesRef.current = strokesRef.current.filter(s => !toRemove.includes(s.id));
      myStrokeIdsRef.current = myStrokeIdsRef.current.filter(id => !toRemove.includes(id));
      redrawCanvas();
      updateUndoRedoState();

      if (socket && roomId) {
        toRemove.forEach(id => socket.emit("erase_stroke", { roomId, strokeId: id }));
      }
    }
  }, [zoom, socket, roomId, redrawCanvas, updateUndoRedoState]);

  // Handlers
  const handleMouseDown = useCallback((e) => {
    // Space + Drag Pan
    if (isSpacePressed) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const point = getPointFromEvent(e);
    if (!point) return;

    if (activeTool === "eraser") {
      setIsDrawing(true);
      eraseStrokeAt(point);
      return;
    }
    if (activeTool === "pen") {
      setIsDrawing(true);
      currentStrokeRef.current = [point];
      currentStrokeIdRef.current = `stroke-${socket.id}-${Date.now()}`;
    }
  }, [activeTool, getPointFromEvent, eraseStrokeAt, socket, isSpacePressed]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPanOffset(p => ({ x: p.x + dx, y: p.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDrawing) return;
    const point = getPointFromEvent(e);
    if (!point) return;

    if (activeTool === "eraser") {
      eraseStrokeAt(point);
      return;
    }

    // Emit cursor position
    const now = Date.now();
    if (socket && roomId && now - lastEmitTimeRef.current >= EMIT_THROTTLE_MS) {
      // We can throttle cursor updates slightly less aggressively or same as draw
      if (!isDrawing || now % 32 < 16) { // example throttle logic
        const worldPoint = getPointFromEvent(e);
        if (worldPoint) {
          socket.volatile.emit("cursor_move", {
            roomId,
            x: worldPoint.x,
            y: worldPoint.y
          });
        }
      }
    }

    if (activeTool === "pen") {
      currentStrokeRef.current.push(point);

      if (ctxRef.current && currentStrokeRef.current.length >= 2) {
        const pts = currentStrokeRef.current.slice(-2);
        drawSmoothStroke(pts, ctxRef.current, penColor, 2);
      }

      if (now - lastEmitTimeRef.current >= EMIT_THROTTLE_MS && socket && roomId) {
        lastEmitTimeRef.current = now;
        socket.emit("draw_event", {
          roomId,
          id: currentStrokeIdRef.current,
          points: currentStrokeRef.current,
          strokeStyle: penColor,
          lineWidth: 2,
        });
      }
    }
  }, [isDrawing, activeTool, getPointFromEvent, eraseStrokeAt, penColor, drawSmoothStroke, socket, roomId, isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && activeTool === "pen" && currentStrokeRef.current.length > 1) {
      const newStroke = {
        id: currentStrokeIdRef.current,
        points: [...currentStrokeRef.current],
        strokeStyle: penColor,
        lineWidth: 2
      };
      strokesRef.current.push(newStroke);
      myStrokeIdsRef.current.push(newStroke.id);
      redoStackRef.current = [];
      updateUndoRedoState();
    }
    setIsDrawing(false);
    currentStrokeRef.current = [];
    currentStrokeIdRef.current = null;
  }, [isDrawing, activeTool, penColor, updateUndoRedoState, isPanning]);

  const handleUndo = useCallback(() => {
    const id = myStrokeIdsRef.current.pop();
    if (!id) return;
    const stroke = strokesRef.current.find(s => s.id === id);
    if (stroke) {
      redoStackRef.current.push(stroke);
      strokesRef.current = strokesRef.current.filter(s => s.id !== id);
      redrawCanvas();
      updateUndoRedoState();
      if (socket && roomId) socket.emit("erase_stroke", { roomId, strokeId: id });
    }
  }, [redrawCanvas, socket, roomId, updateUndoRedoState]);

  const handleRedo = useCallback(() => {
    const stroke = redoStackRef.current.pop();
    if (!stroke) return;
    strokesRef.current.push(stroke);
    myStrokeIdsRef.current.push(stroke.id);
    redrawCanvas();
    updateUndoRedoState();
    if (socket && roomId) {
      socket.emit("draw_event", { roomId, id: stroke.id, points: stroke.points, strokeStyle: stroke.strokeStyle, lineWidth: stroke.lineWidth });
    }
  }, [redrawCanvas, socket, roomId, updateUndoRedoState]);

  const handleClear = useCallback(() => {
    if (!socket || !roomId) return;
    strokesRef.current = [];
    myStrokeIdsRef.current = [];
    redrawCanvas();
    updateUndoRedoState();
    socket.emit("clear_event", { roomId });
  }, [redrawCanvas, socket, roomId, updateUndoRedoState]);

  const handleExport = useCallback(() => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.download = `board-${Date.now()}.png`;
    a.href = url;
    a.click();
  }, []);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(500, z + 20)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(10, z - 20)), []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: colors.uiBg,
        color: colors.textPrimary,
        overflow: "hidden",
        transition: "background-color 0.3s, color 0.3s"
      }}
    >
      {/* Header */}
      <header
        className="p-mobile-2"
        style={{
          height: 60,
          borderBottom: `1px solid ${colors.uiBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          backgroundColor: colors.uiBg,
          transition: "background-color 0.3s, border-color 0.3s"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/workspace/session")}
            style={{
              background: "none",
              border: "none",
              color: colors.textSecondary,
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ←
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: colors.textPrimary,
            }}
          >
            {boardTitle}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <div
            className="hidden-mobile"
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
            <Wifi size={14} />
            <span>Connected</span>
          </div>

          {/* User List Toggle */}
          <button
            onClick={() => setShowUserList(!showUserList)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {/* Current User */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: colors.buttonBg,
                border: `2px solid ${colors.uiBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: colors.textPrimary
              }}
              title="You"
            >
              {(user?.username || "U")[0]?.toUpperCase()}
            </div>

            {/* Count Circle */}
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
          </button>

          {/* User List Dropdown */}
          {showUserList && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 8,
                width: 240,
                backgroundColor: colors.uiBg,
                border: `1px solid ${colors.uiBorder}`,
                borderRadius: 12,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                zIndex: 50,
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${colors.uiBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                <span>Active Users ({users.length})</span>
                <button
                  onClick={() => setShowUserList(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: colors.textSecondary }}
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", padding: "8px 0" }}>
                {users.map((u) => (
                  <div
                    key={u.socketId}
                    style={{
                      padding: "8px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: u.color || "#ccc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#fff"
                      }}
                    >
                      {(u.username || "U")[0]?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, color: colors.textPrimary }}>
                      {u.username || "Unknown"} {u.socketId === socket?.id && "(You)"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Toolbar */}
        <aside
          style={{
            width: 72, // Slightly wider for better spacing
            backgroundColor: colors.uiBg,
            borderRight: `1px solid ${colors.uiBorder}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "16px 0",
            gap: 16,
            transition: "background-color 0.3s, border-color 0.3s"
          }}
        >
          {/* Pen Tool */}
          <button
            onClick={() => setActiveTool("pen")}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              border: "none",
              backgroundColor: activeTool === "pen" ? "#2563eb" : "transparent",
              color: activeTool === "pen" ? "#ffffff" : colors.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            title="Pen"
          >
            <Pencil size={24} />
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => setActiveTool("eraser")}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              border: "none",
              backgroundColor: activeTool === "eraser" ? "#2563eb" : "transparent",
              color: activeTool === "eraser" ? "#ffffff" : colors.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            title="Eraser"
          >
            <Eraser size={24} />
          </button>

          {/* Color Picker */}
          <div style={{ position: "relative", width: 36, height: 36 }}>
            <input
              type="color"
              value={penColor}
              onChange={(e) => {
                setPenColor(e.target.value);
                setActiveTool("pen");
              }}
              style={{
                width: "100%",
                height: "100%",
                padding: 0,
                border: `2px solid ${colors.uiBorder}`,
                borderRadius: "50%",
                cursor: "pointer",
                overflow: "hidden",
                appearance: "none",
                backgroundColor: "transparent",
              }}
              title="Pen Color"
            />
          </div>

          <div
            style={{
              width: "60%",
              height: 1,
              backgroundColor: colors.uiBorder,
              margin: "8px 0",
            }}
          />

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "none",
              backgroundColor: "transparent",
              color: canUndo ? colors.textPrimary : colors.textSecondary,
              cursor: canUndo ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s",
            }}
            title="Undo"
          >
            <Undo size={20} />
          </button>

          {/* Redo */}
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "none",
              backgroundColor: "transparent",
              color: canRedo ? colors.textPrimary : colors.textSecondary,
              cursor: canRedo ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s",
            }}
            title="Redo"
          >
            <Redo size={20} />
          </button>
        </aside>

        {/* Canvas Area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            backgroundColor: colors.background,
            transition: "background-color 0.3s"
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            style={{
              width: "100%",
              height: "100%",
              cursor: isSpacePressed ? "grab" : (activeTool === "pen" ? "crosshair" : "default"),
              touchAction: "none",
            }}
          />
          {/* Remote Cursors Overlay */}
          {Object.entries(cursors).map(([sId, cursor]) => {
            const screenX = cursor.x * (zoom / 100) + panOffset.x;
            const screenY = cursor.y * (zoom / 100) + panOffset.y;
            const user = users.find(u => u.socketId === sId);
            const color = user?.color || "#ff0000";

            return (
              <div
                key={sId}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translate(${screenX}px, ${screenY}px)`,
                  pointerEvents: "none",
                  transition: "transform 0.1s linear",
                  zIndex: 10
                }}
              >
                <MousePointer2 size={16} fill={color} color={color} />
                <div
                  style={{
                    marginLeft: 16,
                    marginTop: 4,
                    backgroundColor: color,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                    color: "#fff",
                    whiteSpace: "nowrap"
                  }}
                >
                  {user?.username || "User"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <footer
        className="p-mobile-2"
        style={{
          height: 64, // Slightly taller for larger controls
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          backgroundColor: colors.uiBg,
          borderTop: `1px solid ${colors.uiBorder}`,
          transition: "background-color 0.3s, border-color 0.3s"
        }}
      >
        {/* Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleZoomOut}
            style={{
              background: "transparent",
              border: `1px solid ${colors.uiBorder}`,
              color: colors.textPrimary,
              cursor: "pointer",
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            −
          </button>
          <span style={{ fontSize: 14, color: colors.textPrimary, minWidth: 50, textAlign: "center" }}>
            {Math.round(zoom)}%
          </span>
          <button
            onClick={handleZoomIn}
            style={{
              background: "transparent",
              border: `1px solid ${colors.uiBorder}`,
              color: colors.textPrimary,
              cursor: "pointer",
              width: 36,
              height: 36,
              borderRadius: 8,
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={handleExport}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Center icon
              width: 48, // Square button
              height: 48,
              backgroundColor: "transparent",
              border: `1px solid ${colors.uiBorder}`,
              color: colors.textPrimary,
              borderRadius: 12, // More rounded
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            title="Export Board"
          >
            <Download size={24} />
          </button>
          <button
            onClick={handleClear}
            disabled={!isConnected}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              backgroundColor: "transparent",
              border: `1px solid ${colors.uiBorder}`,
              color: isConnected ? colors.textPrimary : colors.textSecondary,
              borderRadius: 12,
              cursor: isConnected ? "pointer" : "not-allowed",
              transition: "background-color 0.2s",
            }}
            title="Clear Board"
          >
            <Trash2 size={24} />
          </button>
        </div>
      </footer>
    </div>
  );
}
