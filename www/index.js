import * as wasm from "delaunator-wasm";
import Delaunator from 'delaunator';
import * as Diff from 'diff';

wasm.init();

function nextPoint() {
    return Math.random() * 10;
}

function generateRandomPoints(size) {
    const points = new Float64Array(size * 2)
    for (let i = 0; i < size; i += 2) {
        points[i] = nextPoint();
        points[i+1] = nextPoint();
    }

    return points;
}

function triangulateRS(points) {
    console.log(`WASM: starting triangulation for ${points.length} points.`);

    const start = performance.now();
    const delaunay = wasm.triangulate(points)
    const end_wasm_only = performance.now();
    const elapsed_wasm_only = (end_wasm_only - start).toFixed(2);

    // wasm results are stored in as single array that need to be unpacked
    const offset = 4;
    const empty = delaunay[0];
    const triangles = delaunay[1];
    const halfedges = delaunay[2];
    const result = {
        // empty: empty,
        triangles: delaunay.slice(offset, offset + triangles),
        halfedges: delaunay.slice(offset + triangles, offset + triangles + halfedges),
        hull: delaunay.slice(offset + triangles + halfedges, delaunay.length),
    };
    const end = performance.now();
    const elapsed = (end - start).toFixed(2);
    const elapsedDiff = (elapsed - elapsed_wasm_only).toFixed(2);

    console.log(`WASM: finished - ${ elapsed } ms (wasm: ${elapsed_wasm_only} ms, js: ${elapsedDiff} ms).`);

    return result;
}

function triangulateJS(points) {
    console.log(`JS: starting triangulation for ${points.length} points.`);

    const start = performance.now();
    const delaunay = new Delaunator(points);
    const result = {
        triangles: delaunay.triangles,
        halfedges: delaunay.halfedges,
        hull: delaunay.hull,
    };
    const end = performance.now();
    const elapsed = (end - start).toFixed(2);

    console.log(`JS: finished - ${ elapsed } ms.`);

    return result;
}

function normalize_haldedges(array) {
    // already converts overflow to -1
    return new Int32Array(array);
}

function renderDiff(rs, js) {
    const wasm_result = JSON.stringify(rs, null, '\t');
    const js_result = JSON.stringify(js, null, '\t');
    var diffString = Diff.createTwoFilesPatch("delaunator-rs", "delaunator (js)", wasm_result, js_result);
    var targetElement = document.getElementById('diff');
    var configuration = {
        drawFileList: false,
        fileListToggle: false,
        fileListStartVisible: false,
        fileContentToggle: false,
        matching: 'lines',
        outputFormat: 'side-by-side',
        synchronisedScroll: true,
        highlight: true,
        renderNothingWhenEmpty: false,
    };
    var diff2htmlUi = new Diff2HtmlUI(targetElement, diffString, configuration);
    diff2htmlUi.draw();
    diff2htmlUi.highlightCode();
}

function renderPoints(points, context, r = 2.5, includeLabel = true) {
    for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i+1];
        context.moveTo(x + r, y);
        context.arc(x, y, r, 0, 2 * Math.PI);

        if (includeLabel) {
            context.fillText(i / 2, x, y - r);
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
function renderOnCanvas(points, delaunator, canvasId) {
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
    context.clearRect(0, 0, width, height);
    context.font = '1px serif';

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
    renderPoints(points, context, 1.5 / scale);
    context.fillStyle = "black";
    context.fill();
}

function draw(state) {
    console.log("Draw started");
    renderOnCanvas(state.points, state.rs, "wasm");
    renderOnCanvas(state.points, state.js, "js");
    console.log("Draw finished");
}

var globalState = null;
function update(state) {
    globalState = state;
    draw(state);

    // show difference in the output
    // renderDiff(rs, js);

    console.log(JSON.stringify(state.points, null, '\t'));
    document.getElementById("points").textContent = JSON.stringify(state.points, null, '\t');
}

function generatePoints() {
    // at or below size 100_000, wasm is about 3-4x faster, but on larger input the gap is much smaller
    const size = 10;
    const points = generateRandomPoints(size);

    const rs = triangulateRS(points);
    const js = triangulateJS(points);

    // So we can compare JS and WASM results
    rs.halfedges = normalize_haldedges(rs.halfedges, rs.empty);

    const state = {
        points,
        rs,
        js
    };

    return state;
}

function generateAndUpdatePoints() {
    update(generatePoints());
}

document.getElementById("newPoints").addEventListener("click", generateAndUpdatePoints);
window.addEventListener("resize", function() {
    if (globalState) {
        draw(globalState);
    }
});

generateAndUpdatePoints();