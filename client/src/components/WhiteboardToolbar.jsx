import { useState, useEffect, useCallback, useRef } from "react";

/**
 * WhiteboardToolbar - Production-quality toolbar for collaborative whiteboard
 * 
 * Features:
 * - Pen & Eraser tools with visual highlighting
 * - Undo/Redo with ImageData history stack
 * - Clear canvas with confirmation
 * - Save canvas as PNG
 * - Keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
 * - Dark theme, minimal UI with icons
 */
export default function WhiteboardToolbar({
  tool,
  setTool,
  undo,
  redo,
  canUndo,
  canRedo,
  clearCanvas,
  saveCanvas,
  onAddPage,
  onPreviousPage,
  onNextPage,
  canGoPrevious,
  canGoNext,
  currentPage,
  totalPages,
  canvasRef,
}) {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Cmd/Ctrl + Z (without Shift)
      if (modifier && e.key === "z" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (canUndo) undo();
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        modifier &&
        ((e.shiftKey && e.key === "z") || e.key === "y") &&
        !e.altKey
      ) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  // Tool icons (SVG inline for simplicity)
  const PenIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );

  const EraserIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  );

  const UndoIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );

  const RedoIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );

  const TrashIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );

  const DownloadIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  const AddPageIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );

  const PreviousPageIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );

  const NextPageIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  const handleClear = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the canvas? This cannot be undone.")) {
      clearCanvas();
    }
  }, [clearCanvas]);

  const toolbarStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "#1a1a1a",
    borderBottom: "1px solid #333",
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    overflowX: "auto",
    overflowY: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  };

  const groupStyle = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    paddingRight: "8px",
    borderRight: "1px solid #333",
  };

  const buttonStyle = {
    backgroundColor: "transparent",
    borderWidth: "1px", // use longhand to avoid border shorthand conflicts
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e0e0e0",
    transition: "all 0.2s",
    minWidth: "36px",
    height: "36px",
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#333",
    borderColor: "#555", // override longhand color only
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: 0.4,
    cursor: "not-allowed",
  };

  return (
    <div style={toolbarStyle}>
      {/* Drawing Tools Group */}
      <div style={groupStyle}>
        <button
          onClick={() => setTool("pen")}
          style={tool === "pen" ? activeButtonStyle : buttonStyle}
          title="Pen Tool (P)"
          aria-label="Pen Tool"
        >
          <PenIcon />
        </button>
        <button
          onClick={() => setTool("eraser")}
          style={tool === "eraser" ? activeButtonStyle : buttonStyle}
          title="Eraser Tool (E)"
          aria-label="Eraser Tool"
        >
          <EraserIcon />
        </button>
      </div>

      {/* History Group */}
      <div style={groupStyle}>
        <button
          onClick={undo}
          disabled={!canUndo}
          style={!canUndo ? disabledButtonStyle : buttonStyle}
          title="Undo (Ctrl/Cmd+Z)"
          aria-label="Undo"
        >
          <UndoIcon />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          style={!canRedo ? disabledButtonStyle : buttonStyle}
          title="Redo (Ctrl/Cmd+Shift+Z)"
          aria-label="Redo"
        >
          <RedoIcon />
        </button>
      </div>

      {/* Page Navigation Group */}
      <div style={groupStyle}>
        <button
          onClick={onPreviousPage}
          disabled={!canGoPrevious}
          style={!canGoPrevious ? disabledButtonStyle : buttonStyle}
          title="Previous Page"
          aria-label="Previous Page"
        >
          <PreviousPageIcon />
        </button>
        <button
          onClick={onNextPage}
          disabled={!canGoNext}
          style={!canGoNext ? disabledButtonStyle : buttonStyle}
          title="Next Page"
          aria-label="Next Page"
        >
          <NextPageIcon />
        </button>
        <span
          style={{
            color: "#e0e0e0",
            fontSize: "14px",
            padding: "0 8px",
            minWidth: "60px",
            textAlign: "center",
          }}
        >
          {currentPage} / {totalPages}
        </span>
      </div>

      {/* File Actions Group */}
      <div style={groupStyle}>
        <button
          onClick={onAddPage}
          style={buttonStyle}
          title="Add Page"
          aria-label="Add Page"
        >
          <AddPageIcon />
        </button>
        <button
          onClick={handleClear}
          style={buttonStyle}
          title="Clear Canvas"
          aria-label="Clear Canvas"
        >
          <TrashIcon />
        </button>
        <button
          onClick={saveCanvas}
          style={buttonStyle}
          title="Download as PDF"
          aria-label="Save Canvas"
        >
          <DownloadIcon />
        </button>
      </div>
    </div>
  );
}
