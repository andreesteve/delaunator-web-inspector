import * as wasm from "delaunator-wasm";
import Delaunator from 'delaunator';

wasm.init();

function nextPoint() {
    return 10 * Math.random() + 4 * Math.random() + Math.random();
}

function generateRandomPoints(size) {
    const len = size * 2;
    const points = new Float64Array(len)
    for (let i = 0; i < len; i++) {
        points[i] = nextPoint();
    }

    return points;
}

function normalize_haldedges(array) {
    // already converts overflow to -1
    return new Int32Array(array);
}

export function triangulateRS(points) {
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

    return {
        result,
        elapsed
    };
}

export function triangulateJS(points) {
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

    return {
        result,
        elapsed
    };
}

export function fromPoints(points) {
    // if odd size, remove one point
    if (points.length % 2 == 1) {
        points.pop();
    }

    const { result: rs, elapsed: rsElapsed } = triangulateRS(points);
    const { result: js, elapsed: jsElapsed } = triangulateJS(points);

    // So we can compare JS and WASM results
    rs.halfedges = normalize_haldedges(rs.halfedges, rs.empty);

    const state = {
        points,
        rs,
        rsElapsed,
        js,
        jsElapsed
    };

    return state;
}

export function generatePoints(size = 10) {
    // at or below size 100_000, wasm is about 3-4x faster, but on larger input the gap is much smaller
    console.log(`Generating ${size} points`);
    const points = generateRandomPoints(size);
    return fromPoints(points);
}