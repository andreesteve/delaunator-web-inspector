import renderOnCanvas from './render';
import * as triangulation from './triangulation';
import * as Diff from './differences';
import * as url from './url';

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

    const points = [];
    for (let i = 0; i < state.points.length; i += 2) {
        points.push([state.points[i], state.points[i+1]]);
    }
    document.getElementById("points").value = JSON.stringify(points);
    document.getElementById("js-elapsed").textContent = state.jsElapsed;
    document.getElementById("wasm-elapsed").textContent = state.rsElapsed;
    document.getElementById("diff").innerHTML = "";
    document.getElementById("hashinput").value = url.generateUrl(Array.from(state.points));
}

function showDifference() {
    if (globalState.points.length > 1000) {
        alert("Differences is disabled for large input.");
    } else {
        console.log("Calculating diff");
        Diff.renderDiff(globalState.rs, globalState.js);
    }
}

function generateAndUpdatePoints({ points, size }) {
    if (points) {
        update(triangulation.fromPoints(points));
    } else {
        update(triangulation.generatePoints(size || 10));
    }
}

for (const e of document.getElementsByClassName("generator")) {
    e.addEventListener("click", function() { generateAndUpdatePoints({ size: this.dataset.size }); });
}
window.addEventListener("resize", function() {
    if (globalState) {
        draw(globalState);
    }
});
document.getElementById("show-diff").addEventListener("click", showDifference);
document.getElementById("copyurl").addEventListener("click", function() {
    const input = document.getElementById("hashinput");
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand("copy");
});
document.getElementById("points").addEventListener("change", function() {
    const value = document.getElementById("points").value;
    try {
        const points = JSON.parse(value);

        if (!Array.isArray(points)) {
            throw "Input is not an array."
        }

        const flatPoints = points.flatMap(e => e);
        update(triangulation.fromPoints(flatPoints));
    } catch (e) {
        // TODO show error
        console.error(e);
    }
});
window.addEventListener("hashchange", function() { generateAndUpdatePoints({ points: url.getPointsFromUrl() }); });

const versions = triangulation.getVersions();
document.getElementById("wasm-version").textContent = versions.wasm;
document.getElementById("js-version").textContent = versions.js;

generateAndUpdatePoints({ points: url.getPointsFromUrl() });