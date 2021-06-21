import renderOnCanvas from './render';
import * as triangulation from './triangulation';

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

    const points = [];
    for (let i = 0; i < state.points.length; i += 2) {
        points.push([state.points[i], state.points[i+1]]);
    }
    document.getElementById("points").value = JSON.stringify(points);
}

function generateAndUpdatePoints(size = 10) {
    update(triangulation.generatePoints(size));
}

for (const e of document.getElementsByClassName("generator")) {
    e.addEventListener("click", function() { generateAndUpdatePoints(this.dataset.size); });
}
window.addEventListener("resize", function() {
    if (globalState) {
        draw(globalState);
    }
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
generateAndUpdatePoints();