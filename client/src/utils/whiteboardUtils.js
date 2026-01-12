/**
 * Whiteboard Utilities
 * 
 * Core utilities for stroke-based whiteboard system:
 * - Stroke collision detection (point-in-stroke)
 * - Stroke rendering (smooth quadratic curves)
 * - Geometry helpers
 */

/**
 * Generate unique ID for strokes and pages
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a point is near a stroke (for eraser collision detection)
 * 
 * Algorithm: Point-to-line-segment distance
 * - For each segment in the stroke, calculate distance from point to line segment
 * - Return true if any segment is within threshold distance
 * 
 * @param {Array} strokePoints - Array of {x, y} points
 * @param {Object} point - {x, y} point to check
 * @param {number} threshold - Distance threshold (default: 10px)
 * @returns {boolean} - True if point is near the stroke
 */
export function isPointNearStroke(strokePoints, point, threshold = 10) {
  if (strokePoints.length < 2) return false;

  // Check distance to each line segment
  for (let i = 0; i < strokePoints.length - 1; i++) {
    const p1 = strokePoints[i];
    const p2 = strokePoints[i + 1];
    
    const distance = pointToLineSegmentDistance(point, p1, p2);
    
    if (distance <= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate distance from a point to a line segment
 * 
 * Uses vector projection to find closest point on segment,
 * then calculates Euclidean distance.
 * 
 * @param {Object} point - {x, y} point
 * @param {Object} lineStart - {x, y} start of line segment
 * @param {Object} lineEnd - {x, y} end of line segment
 * @returns {number} - Distance in pixels
 */
function pointToLineSegmentDistance(point, lineStart, lineEnd) {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    // Closest point is lineStart
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    // Closest point is lineEnd
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    // Closest point is on the segment
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Render a stroke smoothly using quadratic curves
 * 
 * Uses the same smooth curve algorithm as the original CanvasBoard
 * to maintain consistency in stroke appearance.
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} points - Array of {x, y} points
 */
export function renderStroke(ctx, points) {
  if (points.length < 2) return;

  if (points.length === 2) {
    // Simple line for 2 points
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    return;
  }

  // Smooth curve for 3+ points (same algorithm as original)
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];

    const xc1 = (p0.x + p1.x) / 2;
    const yc1 = (p0.y + p1.y) / 2;
    const xc2 = (p1.x + p2.x) / 2;
    const yc2 = (p1.y + p2.y) / 2;

    ctx.quadraticCurveTo(p1.x, p1.y, xc2, yc2);
  }

  // Last point
  const lastIndex = points.length - 1;
  ctx.lineTo(points[lastIndex].x, points[lastIndex].y);
  ctx.stroke();
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
