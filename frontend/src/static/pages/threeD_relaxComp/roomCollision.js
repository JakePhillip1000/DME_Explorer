import { Box3, Line3, Vector3, BufferGeometry, Float32BufferAttribute, BufferAttribute } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GenerateMeshBVHWorker } from "three-mesh-bvh/src/workers/GenerateMeshBVHWorker.js";

const worlds = new WeakMap();

export function LoadRoomCollision(scene) {
    if (!worlds.has(scene)) {
        const pending = BuildRoomCollision(scene).catch(error => {
            worlds.delete(scene);
            throw error;
        });
        worlds.set(scene, pending);
    }
    
    return worlds.get(scene);
}

export function CreateCollisionGeometry(scene) {
    scene.updateWorldMatrix(true, true);
    const parts = [];
    const point = new Vector3();

    scene.traverse(object => {
        if (!object.isMesh){
            return;
        }

        const source = object.geometry.getAttribute("position");
        const position = new Float32BufferAttribute(new Float32Array(source.count * 3), 3);
        
        for (let i = 0; i < source.count; i++) {
            point.fromBufferAttribute(source, i).applyMatrix4(object.matrixWorld);
            position.setXYZ(i, point.x, point.y, point.z);
        }

        const part = new BufferGeometry().setAttribute("position", position);
        
        part.setIndex(object.geometry.index
            ? object.geometry.index.clone()
            : new BufferAttribute(Uint32Array.from({length: source.count}, (_, i) => i), 1));
        
            parts.push(part);
    });

    const geometry = mergeGeometries(parts, false);
    parts.forEach(part => part.dispose());

    if (!geometry) {
        throw new Error("This room is unstable collison geometry...");
    }
    return geometry;
}

async function BuildRoomCollision(scene) {
    await new Promise(resolve => setTimeout(resolve, 0));
    const geometry = CreateCollisionGeometry(scene);
    const worker = new GenerateMeshBVHWorker();
    
    try {
        const tree = await worker.generate(geometry, { maxLeafTris: 10 });
        return new RoomCollision(tree);
    } 
    catch (error) {
        geometry.dispose();
        throw error;
    } 
    finally {
        worker.dispose();
    }
}

export class RoomCollision {
    constructor(tree) {
        this.tree = tree;
        this.box = new Box3();
        this.segment = new Line3();
        this.trianglePoint = new Vector3();
        this.capsulePoint = new Vector3();
        this.normal = new Vector3();
        this.offset = new Vector3();
    }

    capsuleIntersect(capsule) {
        this.segment.set(capsule.start, capsule.end);
        this.box.makeEmpty().expandByPoint(capsule.start).expandByPoint(capsule.end).expandByScalar(capsule.radius);
        
        this.tree.shapecast({
            intersectsBounds: (box) => box.intersectsBox(this.box), intersectsTriangle: (triangle) => {
                const distance = triangle.closestPointToSegment(
                    this.segment, this.trianglePoint, this.capsulePoint
                );

                if (distance >= capsule.radius){
                     return false;
                }
                this.normal.subVectors(this.capsulePoint, this.trianglePoint);
                
                if (distance > 1e-8) {
                    this.normal.divideScalar(distance);
                }
                else {
                    triangle.getNormal(this.normal);
                }
                
                this.segment.start.addScaledVector(this.normal, capsule.radius - distance);
                this.segment.end.addScaledVector(this.normal, capsule.radius - distance);
                
                return false;
            }
        });

        this.offset.subVectors(this.segment.start, capsule.start);
        const depth = this.offset.length();

        return depth > 1e-8 ? { normal: this.offset.clone().divideScalar(depth), depth } : false;
    }
}
