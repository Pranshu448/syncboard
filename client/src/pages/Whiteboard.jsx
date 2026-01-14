import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import CanvasBoard from "../components/CanvasBoard";

export default function Whiteboard() {
  const { roomId } = useParams();
  const socket  = useSocket();

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  /* ---------------- SETUP CONTEXT ---------------- */
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2d3436";
    ctx.lineWidth = 3;

    ctxRef.current = ctx;
  }, []);

  /* ---------------- JOIN ROOM ---------------- */
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("join_whiteboard", roomId);

    return () => {
      socket.off("draw_event");
    };
  }, [socket, roomId]);

  /* ---------------- RECEIVE DRAW ---------------- */
  useEffect(() => {
    if (!socket || !ctxRef.current) return;

    const drawRemoteStroke = (data) => {
      if (!ctxRef.current) return;

      const ctx = ctxRef.current;
      const points = data.points;

      if (!points || points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.stroke();
    };

    socket.on("draw_event", drawRemoteStroke);

    return () => {
      socket.off("draw_event", drawRemoteStroke);
    };
  }, [socket]);

  /* ---------------- SEND DRAW ---------------- */
  const handleDraw = (points) => {
    if (!socket) return;

    socket.emit("draw_event", {
      roomId,
      points,
    });
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f5f6fa",
      }}
    >
      <CanvasBoard
        canvasRef={canvasRef}
        onDraw={handleDraw}
      />
    </div>
  );
}
