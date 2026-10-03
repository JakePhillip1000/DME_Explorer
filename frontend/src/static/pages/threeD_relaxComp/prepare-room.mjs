
import fs from "node:fs/promises";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { Texture, TextureLoader, MeshStandardMaterial } from "three";

globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
        blob.arrayBuffer().then(result => {
            this.result = result;
            this.onloadend?.();
        });
    }
};

TextureLoader.prototype.load = function (url) {
    const texture = new Texture();
    texture.userData.file = url;
    return texture;
};

const bytes = await fs.readFile("src/assets/3d_models/building_models/CDLC_room.fbx");

const fileBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

const scene = new FBXLoader().parse(fileBuffer, "");
const bindings = {};
const materials = new Map();

function convert(source) {
    if (materials.has(source)) {
        return materials.get(source);
    }

    const material = new MeshStandardMaterial({
        name: source.name,
        color: source.color,
        opacity: source.opacity,
        transparent: source.transparent,
        side: source.side,
        roughness: 0.8,
        metalness: 0
    });

    if (source.name === "LEDLight") {
        material.emissive.copy(source.emissive);
    }

    bindings[source.name] = {};
    const textureSlots = ["map", "normalMap", "alphaMap","emissiveMap"];

    for (const slot of textureSlots) {
        const texture = source[slot];

        if (!texture?.userData.file) {
            continue;
        }

        bindings[source.name][slot] = {
            file: texture.userData.file,
            repeat: texture.repeat.toArray(),
            offset: texture.offset.toArray(),
            wrapS: texture.wrapS,
            wrapT: texture.wrapT,
            colorSpace: texture.colorSpace,
            flipY: texture.flipY
        };
    }

    materials.set(source, material);
    return material;
}

const lights = [];
scene.traverse(object => {
    if (object.isLight) {
        lights.push(object);
    }

    if (object.isMesh) {
        if (Array.isArray(object.material)) {
            object.material = object.material.map(convert);
        } 
        else {
            object.material = convert(object.material);
        }
    }
});


lights.forEach(light => {
    light.removeFromParent();
});

// Here I will transform the FBX to glb data instead since this
// this type of model use lesser space than fbx and it is more optimize ^^
const glb = await new GLTFExporter().parseAsync(scene, {binary: true});
await fs.writeFile("public/3d_models/CDLC_room/room.glb",Buffer.from(glb));
await fs.writeFile("src/static/pages/threeD_relaxComp/roomTextures.json", JSON.stringify(bindings));
