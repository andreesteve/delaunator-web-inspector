import * as wasm from "delaunator-wasm";
import Delaunator from 'delaunator';

wasm.init();

function nextPoint() {
    return Math.random() * 10;
}

function generatePoints(size) {
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
    const result = wasm.triangulate(points)
    const end = performance.now();
    const elapsed = (end - start).toFixed(2);

    console.log(`WASM: finished - ${ elapsed } ms.`);
}

function triangulateJS(points) {
    console.log(`JS: starting triangulation for ${points.length} points.`);

    const start = performance.now();
    const delaunay = new Delaunator(points);
    const result = delaunay.triangles;
    const end = performance.now();
    const elapsed = (end - start).toFixed(2);

    console.log(`JS: finished - ${ elapsed } ms.`);
}

const size = 100;
const points = generatePoints(size);

triangulateRS(points);
triangulateJS(points);