import * as Diff from 'diff';

export function renderDiff(rs, js) {
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