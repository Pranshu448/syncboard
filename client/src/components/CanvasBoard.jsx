import { useRef, useEffect, useState, useCallback } from "react";

export default function CanvasBoard({ onDraw, canvasRef, onClear }) {
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const pointsRef = useRef([]);
  const rafRef = useRef(null);

  // Helper to get point from event (mouse or touch)
  const getPointFromEvent = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      // Store current canvas content
      const imageData = ctxRef.current?.getImageData(0, 0, canvas.width, canvas.height);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);

      // Restore canvas content if it existed
      if (imageData && ctxRef.current) {
        ctx.putImageData(imageData, 0, 0);
      }

      // ✅ FINER PEN SETTINGS
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#2d3436";
      ctx.lineWidth = 3;
      
      // ✅ SOFTENS THE EDGES (Anti-aliasing boost)
      ctx.shadowBlur = 1;
      ctx.shadowColor = "#2d3436";

      ctxRef.current = ctx;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [canvasRef]);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    setDrawing(true);
    const point = getPointFromEvent(e);
    pointsRef.current = [point];
  }, [getPointFromEvent]);

  const draw = useCallback((e) => {
    if (!drawing) return;
    e.preventDefault();

    const point = getPointFromEvent(e);
    pointsRef.current.push(point);

    // ✅ USE REQUEST ANIMATION FRAME FOR SMOOTHNESS
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (ctxRef.current && pointsRef.current.length >= 2) {
        drawSmoothStroke(pointsRef.current, ctxRef.current);
      }
    });
  }, [drawing, getPointFromEvent]);

  const drawSmoothStroke = (points, ctx) => {
    if (points.length < 2) return;

    if (points.length === 2) {
      // Simple line for first two points
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
      return;
    }

    // Smooth curve for 3+ points
    const lastThree = points.slice(-3);
    const p0 = lastThree[0];
    const p1 = lastThree[1];
    const p2 = lastThree[2];

    const xc1 = (p0.x + p1.x) / 2;
    const yc1 = (p0.y + p1.y) / 2;
    const xc2 = (p1.x + p2.x) / 2;
    const yc2 = (p1.y + p2.y) / 2;

    ctx.beginPath();
    ctx.moveTo(xc1, yc1);
    ctx.quadraticCurveTo(p1.x, p1.y, xc2, yc2);
    ctx.stroke();
  };

  const endDraw = useCallback((e) => {
    if (e) e.preventDefault();
    if (!drawing) return;
    
    setDrawing(false);
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (pointsRef.current.length > 1 && onDraw) {
      onDraw(pointsRef.current);
    }
    pointsRef.current = [];
  }, [drawing, onDraw]);

  // Expose clear method via ref if needed
  useEffect(() => {
    if (onClear && canvasRef.current) {
      const clearCanvas = () => {
        if (ctxRef.current && canvasRef.current) {
          ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      };
      // Store clear function if parent needs it
      canvasRef.current.clearCanvas = clearCanvas;
    }
  }, [onClear, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={startDraw}
      onTouchMove={draw}
      onTouchEnd={endDraw}
      onTouchCancel={endDraw}
      style={{
        width: "100%",
        height: "100%",
        touchAction: "none",
        cursor: "crosshair",
      }}
    />
  );
}