import { NodeIO, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, weld, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import fs from "node:fs/promises";
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

// this one will read the GLB files
const io = new NodeIO();

io.registerExtensions(ALL_EXTENSIONS);

io.registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder
});

const file = "public/3d_models/CDLC_room/room.glb";
const originalSize = (await fs.stat(file)).size;
const document = await io.read(file);

await document.transform(
    dedup({propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH]}),
    weld(),

    meshopt({encoder: MeshoptEncoder,level: "high"})
);

await io.write(file, document);
const compressedSize = (await fs.stat(file)).size;

const savedBytes = originalSize - compressedSize;
const savedPercentage = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;

// This is the room size result
// I hope it is more optimized ^^
console.log("Original room bytes:", originalSize);
console.log("Compressed room bytes:", compressedSize);
console.log("Space saved:", `${savedPercentage.toFixed(2)}%`);