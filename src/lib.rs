mod utils;

use delaunator::{EMPTY, Point};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

mod built_info {
    // The file has been placed there by the build script.
    include!(concat!(env!("OUT_DIR"), "/built.rs"));
 }

#[wasm_bindgen]
pub fn init() -> String {
    utils::set_panic_hook();

    // get delaunator version
    built_info::DEPENDENCIES.iter()
        .filter(|(name, _)| name == &"delaunator")
        .map(|(_, version)| version)
        .copied()
        .next()
        .unwrap_or(&"")
        .into()
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