export default renderOnCanvas;

function renderPoints(points, context, r = 2.5, includeLabel = true) {
    for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i+1];
        context.moveTo(x + r, y);
        context.arc(x, y, r, 0, 2 * Math.PI);

        if (includeLabel) {
            context.fillText(i / 2, x - 4*r, y - 4*r);
        }
    }
}

function renderEdges(points, delaunator, context) {
    for (let i = 0, n = delaunator.halfedges.length; i < n; ++i) {
        if (i > delaunator.halfedges[i]) {
            const p = delaunator.triangles[i];
            const q = delaunator.triangles[i % 3 === 2 ? i - 2 : i + 1];
            context.moveTo(points[p * 2], points[p * 2 + 1]);
            context.lineTo(points[q * 2], points[q * 2 + 1]);
        }
    }
}

function renderInternalEdges(points, delaunator, context) {
    for (let i = 0, n = delaunator.halfedges.length; i < n; ++i) {
      const j = delaunator.halfedges[i];
      if (i < j) {
        const p = delaunator.triangles[i];
        const q = delaunator.triangles[j];
        context.moveTo(points[p * 2], points[p * 2 + 1]);
        context.lineTo(points[q * 2], points[q * 2 + 1]);
      }
    }
  }

// adapted from https://observablehq.com/d/2ffd8a583a29944d
function renderOnCanvas(points, delaunator, canvasId, includeLabels) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');

    // fix blur
    const dpi = window.devicePixelRatio;
    const style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    const style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
    canvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);
    const width = canvas.width;
    const height = canvas.height;

    let minX = +Infinity;
    let minY = +Infinity
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < points.length; i += 2) {
        minX = Math.min(points[i], minX);
        minY = Math.min(points[i+1], minY);
        maxX = Math.max(points[i], maxX);
        maxY = Math.max(points[i+1], maxY);
    }

    const scale = Math.min(width / (maxX - minX), height / (maxY - minY)) * 0.75;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    console.log(width * height);
    context.fillStyle = "black";
    context.font = '0.05em serif';

    context.translate(width / 2, height / 2);
    context.scale(scale, scale);
    context.translate(-(minX + maxX) / 2, -(minY + maxY) / 2);
    context.lineWidth = 1 / scale;

    context.beginPath();
    renderEdges(points, delaunator, context);
    context.strokeStyle = "blue";
    context.stroke();

    context.beginPath();
    renderInternalEdges(points, delaunator, context);
    context.strokeStyle = "red";
    context.stroke();

    context.beginPath();
    renderPoints(points, context, 1.5 / scale, includeLabels);
    context.fillStyle = "black";
    context.fill();
}