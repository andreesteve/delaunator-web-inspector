mod utils;

use delaunator::Point;
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

    delaunator::triangulate(&p)
        .unwrap()
        .halfedges.into_boxed_slice()
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, delaunator-web-inspector!");
}