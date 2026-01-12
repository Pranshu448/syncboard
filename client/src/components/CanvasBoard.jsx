import { useRef, useEffect, useState, useCallback } from "react";
import { renderStroke, isPointNearStroke } from "../utils/whiteboardUtils";

/**
 * CanvasBoard - Stroke-based rendering canvas for ONE page only
 * 
 * Architecture:
 * - Rendering is declarative: clears canvas and redraws from strokes array
 * - Renders ONLY the current page's strokes (no multi-page logic)
 * - Eraser detects stroke collisions and calls onEraseStroke callback
 * - Drawing coordinates are clipped to page boundaries
 * - NO scrolling - fixed height canvas for single page
 */
export default function CanvasBoard({
  canvasRef,
  tool = "pen",
  strokes = [], // Strokes for CURRENT page only
  activePageId,
  pageWidth,
  pageHeight,
  onStrokeComplete,
  onEraseStroke,
}) {
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const pointsRef = useRef([]);

  // Helper: Draw page boundary (single page border)
  const drawPageBoundary = useCallback((ctx) => {
    if (!pageWidth || !pageHeight) return;

    ctx.save();
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.strokeRect(0, 0, pageWidth, pageHeight);
    ctx.restore();
  }, [pageWidth, pageHeight]);


  // Helper: Redraw entire canvas from strokes array (current page only)
  const redrawCanvas = useCallback(() => {
    if (!ctxRef.current || !canvasRef.current) return;

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = canvas.width / dpr;
    const viewportHeight = canvas.height / dpr;

    // Clear canvas with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Draw page boundary (single page border)
    drawPageBoundary(ctx);

    // Render all strokes for current page (no filtering needed - strokes are pre-filtered)
    strokes.forEach((stroke) => {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.style?.strokeStyle || "#2d3436";
      ctx.lineWidth = stroke.style?.lineWidth || 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowBlur = stroke.style?.shadowBlur || 1;
      ctx.shadowColor = stroke.style?.shadowColor || "#2d3436";

      // Render stroke points directly (no offset needed - single page)
      renderStroke(ctx, stroke.points);
      ctx.restore();
    });
  }, [strokes, pageWidth, pageHeight, drawPageBoundary]);

  // Initialize canvas with devicePixelRatio scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);

      ctxRef.current = ctx;
      redrawCanvas();
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [canvasRef, redrawCanvas]);

  // Re-render when strokes or pages change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Clip point to page boundaries (single page - no offset needed)
  const clipToPage = useCallback((point) => {
    return {
      x: Math.max(0, Math.min(pageWidth || 0, point.x)),
      y: Math.max(0, Math.min(pageHeight || 0, point.y)),
    };
  }, [pageWidth, pageHeight]);

  // Convert screen coordinates to page-relative coordinates (no offset needed)
  const screenToPageCoords = useCallback((screenX, screenY) => {
    return {
      x: screenX,
      y: screenY,
    };
  }, []);

  // Track erased strokes to avoid re-erasing during drag
  const erasedStrokeIdsRef = useRef(new Set());

  // Start drawing
  const startDraw = useCallback((e) => {
    if (tool === "eraser") {
      // Eraser mode: start dragging
      setDrawing(true);
      erasedStrokeIdsRef.current.clear();
      
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const pageCoords = screenToPageCoords(screenX, screenY);

      // Find strokes on active page
      const activePageStrokes = strokes.filter((s) => s.pageId === activePageId);

      // Check collision with each stroke (reverse order for visual correctness)
      for (let i = activePageStrokes.length - 1; i >= 0; i--) {
        const stroke = activePageStrokes[i];
        if (!erasedStrokeIdsRef.current.has(stroke.id) && isPointNearStroke(stroke.points, pageCoords, 10)) {
          // Erase this stroke
          if (onEraseStroke) {
            onEraseStroke(stroke.id);
            erasedStrokeIdsRef.current.add(stroke.id);
          }
          break; // Only erase one stroke per point
        }
      }
      return;
    }

    // Pen mode: start new stroke
    setDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const clippedPoint = clipToPage({ x: screenX, y: screenY });
    const pageCoords = screenToPageCoords(clippedPoint.x, clippedPoint.y);

    pointsRef.current = [pageCoords];
  }, [tool, activePageId, strokes, clipToPage, screenToPageCoords, onEraseStroke, canvasRef]);

  // Continue drawing
  const draw = useCallback((e) => {
    if (!drawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (tool === "eraser") {
      // Eraser mode: continuously detect strokes while dragging
      const pageCoords = screenToPageCoords(screenX, screenY);

      // Find strokes on active page
      const activePageStrokes = strokes.filter((s) => s.pageId === activePageId);

      // Check collision with each stroke (reverse order for visual correctness)
      for (let i = activePageStrokes.length - 1; i >= 0; i--) {
        const stroke = activePageStrokes[i];
        if (!erasedStrokeIdsRef.current.has(stroke.id) && isPointNearStroke(stroke.points, pageCoords, 10)) {
          // Erase this stroke
          if (onEraseStroke) {
            onEraseStroke(stroke.id);
            erasedStrokeIdsRef.current.add(stroke.id);
          }
          break; // Only erase one stroke per point
        }
      }
      return;
    }

    // Pen mode: continue stroke
    const clippedPoint = clipToPage({ x: screenX, y: screenY });
    const pageCoords = screenToPageCoords(clippedPoint.x, clippedPoint.y);

    pointsRef.current.push(pageCoords);

    // Optimistic rendering: draw the stroke as user draws
    if (ctxRef.current && pointsRef.current.length >= 2) {
      const ctx = ctxRef.current;
      ctx.save();
      ctx.strokeStyle = "#2d3436";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowBlur = 1;
      ctx.shadowColor = "#2d3436";

      // Render points directly (no offset needed - single page)
      renderStroke(ctx, pointsRef.current);
      ctx.restore();
    }
  }, [drawing, tool, activePageId, strokes, clipToPage, screenToPageCoords, onEraseStroke]);

  // End drawing
  const endDraw = useCallback(() => {
    if (!drawing) return;

    setDrawing(false);

    if (tool === "eraser") {
      // Clear erased strokes tracking
      erasedStrokeIdsRef.current.clear();
      return;
    }

    if (pointsRef.current.length >= 2 && onStrokeComplete) {
      // Complete stroke
      onStrokeComplete({
        pageId: activePageId,
        tool: "pen",
        points: pointsRef.current,
        style: {
          strokeStyle: "#2d3436",
          lineWidth: 5,
          shadowBlur: 1,
          shadowColor: "#2d3436",
        },
      });
    }

    pointsRef.current = [];
  }, [drawing, tool, activePageId, onStrokeComplete]);

  // Cursor style based on tool
  const cursorStyle = tool === "eraser" ? "cell" : "crosshair";

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      style={{
        width: "100%",
        height: "100%",
        touchAction: "none",
        cursor: cursorStyle,
        display: "block",
      }}
    />
  );
}