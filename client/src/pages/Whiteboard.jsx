import { useParams } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import CanvasBoard from "../components/CanvasBoard";
import WhiteboardToolbar from "../components/WhiteboardToolbar";
import { generateId, renderStroke } from "../utils/whiteboardUtils";

/**
 * Whiteboard - Multi-page stroke-based collaborative whiteboard
 * 
 * Architecture:
 * - Pages: Array of page objects with id
 * - Strokes: Array of stroke objects with id, pageId, tool, points, style
 * - Rendering: Declarative - redraws from strokes array
 * - History: Stroke-based undo/redo (not pixel-based)
 * - Navigation: Page-based navigation (slides-style), NO scrolling
 */

// Constants
const PAGE_HEIGHT = 800; // A4-like ratio (assuming ~800px viewport width)
const TOOLBAR_HEIGHT = 52;

export default function Whiteboard() {
  const { roomId } = useParams();
  const { socket } = useSocket();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [tool, setTool] = useState("pen");
  const [strokes, setStrokes] = useState([]);
  const [pages, setPages] = useState([{ id: generateId() }]); // Start with one page
  const [activePageIndex, setActivePageIndex] = useState(0); // Page-based navigation (slides-style)
  const [pageWidth, setPageWidth] = useState(0);

  // History for undo/redo (stroke-based)
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef([]); // Array of stroke arrays
  const maxHistorySize = 100;

  // Update page width based on container
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setPageWidth(width);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Clamp activePageIndex to valid range when pages change
  useEffect(() => {
    if (activePageIndex >= pages.length) {
      setActivePageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, activePageIndex]);

  // Save state to history
  const saveToHistory = useCallback((newStrokes) => {
    // Remove future states if we're not at the end
    if (historyIndex < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndex + 1);
    }

    // Add new state
    historyRef.current.push([...newStrokes]);
    const newIndex = historyRef.current.length - 1;

    // Limit history size
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current.shift();
      setHistoryIndex(newIndex - 1);
    } else {
      setHistoryIndex(newIndex);
    }
  }, [historyIndex]);

  // Helper to safely clamp and (optionally) emit active page changes
  const setActivePageIndexSafe = useCallback((nextIndex, emit = true) => {
    const maxIndex = Math.max(pages.length - 1, 0);
    const clamped = Math.max(0, Math.min(nextIndex, maxIndex));
    setActivePageIndex(clamped);

    if (emit && socket && roomId) {
      socket.emit("whiteboard:set_page", {
        roomId,
        activePageIndex: clamped,
      });
    }
  }, [pages.length, socket, roomId]);

  // Socket integration (for collaborative drawing)
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("join_room", roomId);

    const handleStroke = ({ stroke }) => {
      if (!stroke?.id) return;
      setStrokes((prev) => {
        const exists = prev.some((s) => s.id === stroke.id);
        if (exists) return prev;
        const newStrokes = [...prev, stroke];
        saveToHistory(newStrokes);
        return newStrokes;
      });
    };

    const handleErase = ({ strokeId }) => {
      if (!strokeId) return;
      setStrokes((prev) => {
        const exists = prev.some((s) => s.id === strokeId);
        if (!exists) return prev;
        const newStrokes = prev.filter((s) => s.id !== strokeId);
        saveToHistory(newStrokes);
        return newStrokes;
      });
    };

    const handleAddPageEvent = ({ page, activePageIndex: remoteIndex }) => {
      if (!page?.id) return;
      setPages((prev) => {
        const exists = prev.some((p) => p.id === page.id);
        const updatedPages = exists ? prev : [...prev, page];
        if (typeof remoteIndex === "number") {
          const maxIndex = Math.max(updatedPages.length - 1, 0);
          const clamped = Math.max(0, Math.min(remoteIndex, maxIndex));
          setActivePageIndex(clamped);
        }
        return updatedPages;
      });
    };

    const handleSetPage = ({ activePageIndex: remoteIndex }) => {
      if (typeof remoteIndex !== "number") return;
      const maxIndex = Math.max(pages.length - 1, 0);
      const clamped = Math.max(0, Math.min(remoteIndex, maxIndex));
      setActivePageIndex(clamped);
    };

    socket.on("whiteboard:stroke", handleStroke);
    socket.on("whiteboard:erase_stroke", handleErase);
    socket.on("whiteboard:add_page", handleAddPageEvent);
    socket.on("whiteboard:set_page", handleSetPage);

    return () => {
      socket.off("whiteboard:stroke", handleStroke);
      socket.off("whiteboard:erase_stroke", handleErase);
      socket.off("whiteboard:add_page", handleAddPageEvent);
      socket.off("whiteboard:set_page", handleSetPage);
    };
  }, [socket, roomId, saveToHistory, pages.length]);

  // Handle stroke completion
  const handleStrokeComplete = useCallback((strokeData) => {
    const newStroke = {
      id: generateId(),
      ...strokeData,
    };

    setStrokes((prev) => {
      const newStrokes = [...prev, newStroke];
      saveToHistory(newStrokes);
      return newStrokes;
    });

    // Send to socket (for collaboration)
    if (socket) {
      socket.emit("whiteboard:stroke", {
        roomId,
        stroke: newStroke,
      });
    }
  }, [socket, roomId, saveToHistory]);

  // Handle stroke erasure
  const handleEraseStroke = useCallback((strokeId, emit = true) => {
    setStrokes((prev) => {
      const exists = prev.some((s) => s.id === strokeId);
      if (!exists) return prev;
      const newStrokes = prev.filter((s) => s.id !== strokeId);
      saveToHistory(newStrokes);

      if (emit && socket && roomId) {
        socket.emit("whiteboard:erase_stroke", {
          roomId,
          strokeId,
        });
      }

      return newStrokes;
    });
  }, [saveToHistory, socket, roomId]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStrokes([...historyRef.current[newIndex]]);
    }
  }, [historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < historyRef.current.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setStrokes([...historyRef.current[newIndex]]);
    }
  }, [historyIndex]);

  // Clear active page
  const handleClear = useCallback(() => {
    if (!window.confirm("Clear all strokes on the current page? This cannot be undone.")) {
      return;
    }

    const currentPage = pages[activePageIndex];
    if (!currentPage) return;

    setStrokes((prev) => {
      const pageStrokeIds = prev.filter((s) => s.pageId === currentPage.id).map((s) => s.id);
      if (!pageStrokeIds.length) return prev;

      const newStrokes = prev.filter((s) => s.pageId !== currentPage.id);
      saveToHistory(newStrokes);

      if (socket && roomId) {
        pageStrokeIds.forEach((strokeId) => {
          socket.emit("whiteboard:erase_stroke", { roomId, strokeId });
        });
      }

      return newStrokes;
    });
  }, [activePageIndex, pages, saveToHistory, socket, roomId]);

  // Export all pages as PDF
  // PDF Generation Steps:
  // 1. Import jsPDF library (lightweight PDF generator)
  // 2. Create PDF document with dimensions matching whiteboard page size
  // 3. For each page:
  //    a. Create temporary canvas
  //    b. Render all strokes for that page onto canvas
  //    c. Convert canvas to PNG image data
  //    d. Add image as a page in the PDF
  // 4. Download the complete multi-page PDF
  
  const handleSave = useCallback(async () => {
    // Step 1: Import jsPDF dynamically (only loads when download is clicked)
    const { jsPDF } = await import("jspdf"); // use ESM import to avoid require in browser

    // Step 2: Create PDF document with dimensions matching whiteboard page
    // Convert pixels to millimeters (assuming 96 DPI standard)
    const pageWidthMm = (pageWidth / 96) * 25.4;
    const pageHeightMm = (PAGE_HEIGHT / 96) * 25.4;
    const pdf = new jsPDF({
      orientation: pageWidthMm > pageHeightMm ? "landscape" : "portrait",
      unit: "mm",
      format: [pageWidthMm, pageHeightMm],
    });

    // Step 3: Render each whiteboard page as a PDF page
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      
      // Step 3a: Create temporary canvas for rendering this page
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = pageWidth;
      tempCanvas.height = PAGE_HEIGHT;
      const tempCtx = tempCanvas.getContext("2d");

      // Fill canvas with white background
      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw page boundary (optional visual reference)
      tempCtx.strokeStyle = "#e0e0e0";
      tempCtx.lineWidth = 1;
      tempCtx.strokeRect(0, 0, pageWidth, PAGE_HEIGHT);

      // Step 3b: Render all strokes for this page onto canvas
      const pageStrokes = strokes.filter((s) => s.pageId === page.id);
      pageStrokes.forEach((stroke) => {
        tempCtx.save();
        tempCtx.strokeStyle = stroke.style?.strokeStyle || "#2d3436";
        tempCtx.lineWidth = stroke.style?.lineWidth || 5;
        tempCtx.lineCap = "round";
        tempCtx.lineJoin = "round";
        tempCtx.shadowBlur = stroke.style?.shadowBlur || 1;
        tempCtx.shadowColor = stroke.style?.shadowColor || "#2d3436";

        // Render stroke using same algorithm as canvas display
        renderStroke(tempCtx, stroke.points);
        tempCtx.restore();
      });

      // Step 3c: Convert canvas to PNG image data URL
      const imgData = tempCanvas.toDataURL("image/png");

      // Step 3d: Add page to PDF (first page already exists, add new pages for others)
      if (pageIndex > 0) {
        pdf.addPage([pageWidthMm, pageHeightMm], pageWidthMm > pageHeightMm ? "landscape" : "portrait");
      }

      // Add the rendered image to the PDF page (fills entire page)
      pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm);
    }

    // Step 4: Download the complete multi-page PDF
    pdf.save(`whiteboard-${roomId || "drawing"}-${Date.now()}.pdf`);
  }, [strokes, pages, pageWidth, roomId]);

  // Initialize history
  useEffect(() => {
    if (strokes.length === 0 && historyRef.current.length === 0) {
      historyRef.current = [[]];
      setHistoryIndex(0);
    }
  }, [strokes.length]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  // Get current active page
  const activePage = pages[activePageIndex];
  const activePageId = activePage?.id;

  // Get strokes for current page only
  const currentPageStrokes = strokes.filter((s) => s.pageId === activePageId);

  // Add new page and switch to it immediately (slides-style)
  const handleAddPage = useCallback(() => {
    const newPage = { id: generateId() };
    setPages((prev) => {
      const updated = [...prev, newPage];
      const newIndex = updated.length - 1;
      setActivePageIndexSafe(newIndex, false);

      if (socket && roomId) {
        socket.emit("whiteboard:add_page", {
          roomId,
          page: newPage,
          activePageIndex: newIndex,
        });
      }

      return updated;
    });
  }, [setActivePageIndexSafe, socket, roomId]);

  // Navigate to previous page
  const handlePreviousPage = useCallback(() => {
    if (activePageIndex > 0) {
      setActivePageIndexSafe(activePageIndex - 1);
    }
  }, [activePageIndex, setActivePageIndexSafe]);

  // Navigate to next page
  const handleNextPage = useCallback(() => {
    if (activePageIndex < pages.length - 1) {
      setActivePageIndexSafe(activePageIndex + 1);
    }
  }, [activePageIndex, pages.length, setActivePageIndexSafe]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <WhiteboardToolbar
        tool={tool}
        setTool={setTool}
        undo={handleUndo}
        redo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        clearCanvas={handleClear}
        saveCanvas={handleSave}
        onAddPage={handleAddPage}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        canGoPrevious={activePageIndex > 0}
        canGoNext={activePageIndex < pages.length - 1}
        currentPage={activePageIndex + 1}
        totalPages={pages.length}
        canvasRef={canvasRef}
      />
      {/* Single canvas container - NO scrolling, fixed height */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: "hidden", // NO scrolling allowed
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: `${TOOLBAR_HEIGHT}px`,
        }}
      >
        {/* Canvas renders ONE page only - fixed height */}
        <div
          style={{
            width: pageWidth || "100%",
            height: `${PAGE_HEIGHT}px`,
            position: "relative",
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <CanvasBoard
            canvasRef={canvasRef}
            tool={tool}
            strokes={currentPageStrokes}
            activePageId={activePageId}
            pageWidth={pageWidth}
            pageHeight={PAGE_HEIGHT}
            onStrokeComplete={handleStrokeComplete}
            onEraseStroke={handleEraseStroke}
          />
        </div>
      </div>
    </div>
  );
}