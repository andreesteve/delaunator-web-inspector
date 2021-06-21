mod utils;

use delaunator::{EMPTY, Point};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn init() {
    utils::set_panic_hook();
}

#[wasm_bindgen]
pub fn triangulate(points: &[f64]) -> Box<[usize]>  {
    let p : Vec<_> = points.chunks(2)
        .map(|v| Point { x: v[0], y: v[1] })
        .collect();

    let mut t = delaunator::triangulate(&p)
        .unwrap();

    // convert all results into single array that will be copied back into JS memory
    let mut result = Vec::with_capacity(4 + t.triangles.len() + t.halfedges.len() + t.hull.len());
    result.push(EMPTY);
    result.push(t.triangles.len());
    result.push(t.halfedges.len());
    result.push(t.hull.len());
    result.append(&mut t.triangles);
    result.append(&mut t.halfedges);
    result.append(&mut t.hull);

    result.into_boxed_slice()
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, delaunator-web-inspector!");
}