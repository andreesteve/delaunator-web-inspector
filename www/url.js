import * as rison from 'rison';

export function getPointsFromUrl() {
    if (window.location.hash) {
        try {
            return rison.decode_array(window.location.hash.substring(1));
        } catch (e) {
            console.error(e);
        }

        return null;
    }

    return null;
}

export function generateUrl(points) {
    let base = window.location.origin + "#";
    base = base + rison.encode_array(points);
    console.log(base);
    return base;
}