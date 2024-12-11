import { fileURLToPath } from 'url';
import path from "path";
import shapefile from "shapefile";
import * as earclip from "earclip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function random(seed) {
    seed = seed % 2147483647;
    if (seed <= 0) seed += 2147483646;
    seed ^= (seed << 21);
    seed ^= (seed >>> 35);
    seed ^= (seed << 4);
    seed = seed % 2147483647;
    if (seed <= 0) seed += 2147483646;
    return (seed - 1) / 2147483646;
}

function getRandomTriangle(triangles, areas, seed) {
    const cumulativeAreas = [];
    let totalArea = 0;
    for (let area of areas) {
        totalArea += area;
        cumulativeAreas.push(totalArea);
    }
    const randomValue = random(seed) * totalArea;
    for (let i = 0; i < cumulativeAreas.length; i++) {
        if (randomValue <= cumulativeAreas[i]) {
            return triangles[i];
        }
    }
    return triangles[triangles.length - 1];
}

export default async function randomCoordinate(countries, seed) {
    const source = await shapefile.open(path.join(__dirname, "world.shp"), path.join(__dirname, "world.dbf"));
    const triangles = [];
    let result;
    while (!(result = await source.read()).done) {
        const feature = result.value;
        const coords = feature.geometry.coordinates;
        if (!countries.includes(feature.properties.NAME.replaceAll("\x00", "")) && !countries.includes("World")) {
            continue;
        }
        function traverse(group) {
            const flatGeometry = [];
            if (Array.isArray(group) && !Array.isArray(group[0][0])) {
                group.forEach((point) => {
                    flatGeometry.push(point);
                });
            } else if (Array.isArray(group)) {
                group.forEach((point) => {
                    traverse(point);
                });
            }
            if (flatGeometry.length > 0) {
                const shape = earclip.earclip([flatGeometry]);
                if (shape.indices.length === 0) {
                    for (let i = 0; i < shape.vertices.length; i += 3) {
                        const p1 = shape.vertices[i];
                        const p2 = shape.vertices[i + 1];
                        const p3 = shape.vertices[i + 2];
                        triangles.push({ p1, p2, p3 });
                    }
                } else {
                    for (let i = 0; i < shape.indices.length; i += 3) {
                        const i1 = shape.indices[i] * 2;
                        const i2 = shape.indices[i + 1] * 2;
                        const i3 = shape.indices[i + 2] * 2;
                        triangles.push({
                            p1: [shape.vertices[i1], shape.vertices[i1 + 1]],
                            p2: [shape.vertices[i2], shape.vertices[i2 + 1]],
                            p3: [shape.vertices[i3], shape.vertices[i3 + 1]]
                        });
                    }
                }
            }
        }
        traverse(coords);
    }

    const areas = triangles.map((tri) => {
        return Math.abs(
            (tri.p1[0] * (tri.p2[1] - tri.p3[1]) +
                tri.p2[0] * (tri.p3[1] - tri.p1[1]) +
                tri.p3[0] * (tri.p1[1] - tri.p2[1])) / 2);
    });

    const triangle = getRandomTriangle(triangles, areas, seed);

    let u = random(seed / 2);
    let v = random(seed * 2);
    if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
    }
    return [
        (1 - u - v) * triangle.p1[0] + u * triangle.p2[0] + v * triangle.p3[0],
        (1 - u - v) * triangle.p1[1] + u * triangle.p2[1] + v * triangle.p3[1]
    ];
}
