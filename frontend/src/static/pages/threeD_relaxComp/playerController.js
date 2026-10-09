import { Vector3 } from "three";

// this one is the FPS control of the player
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { LoadRoomCollision } from "./roomCollision.js";
import { Capsule } from "three/examples/jsm/math/Capsule.js";

export class Player {
    constructor(camera, canvas, scene, spawn, onActiveChange) {
        this.camera = camera;
        this.spawn = new Vector3(...spawn);
        this.velocity = new Vector3();
        this.direction = new Vector3();
        this.forward = new Vector3();
        this.right = new Vector3();
        this.movement = new Vector3();
        this.keys = new Set();

        this.walkSpeed = 3;
        this.runSpeed = 5;
        this.jumpSpeed = 6;
        this.gravity = 18;
        this.onFloor = false;
        this.health = 100;
        this.stamina = 100;
        this.exhausted = false;

        this.collider = new Capsule(new Vector3(), new Vector3(), 0.3);
        this.controls = new PointerLockControls(camera, canvas);

        this.world = null;
        this.disposed = false;
        this.ready = LoadRoomCollision(scene).then(world => {
            if (!this.disposed) this.world = world;
        });

        this.onKeyDown = (event) => {
            if (!this.controls.isLocked) {
                return;
            }

            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
                event.preventDefault();
            }

            this.keys.add(event.code);

            if (event.code === "Space" && !event.repeat && this.onFloor) {
                this.velocity.y = this.jumpSpeed;
                this.onFloor = false;
            }

            if (event.code === "KeyR" && !event.repeat) {
                this.reset();
            }
        };

        this.onKeyUp = (event) => {
            this.keys.delete(event.code);
        }

        this.onLock = () => {
             onActiveChange(true);
        }

        this.onUnlock = () => {
            this.keys.clear();
            this.velocity.set(0, 0, 0);
            onActiveChange(false);
        };

        this.onBlur = () => {
            this.keys.clear();
            this.controls.unlock();
        };

        this.onPointerError = () => {
            this.controls.unlock();
            onActiveChange(false);
        };

        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("blur", this.onBlur);
        document.addEventListener("pointerlockerror", this.onPointerError);
        this.controls.addEventListener("lock", this.onLock);
        this.controls.addEventListener("unlock", this.onUnlock);

        this.reset();
    }

    start() {
        if (!this.world || this.disposed) return;
        this.controls.lock();
    }

    pause() {
        this.controls.unlock();
    }

    getNetworkState() {
        this.camera.getWorldDirection(this.forward);
        const moving = Math.hypot(this.velocity.x, this.velocity.z);

        let action;

        if (!this.controls.isLocked) {
            action = "paused";
        } 
        else if (!this.onFloor) {
            action = "jump";
        } 
        else if (moving > this.walkSpeed + 0.1) {
            action = "run";
        } 
        else if (moving > 0.1) {
            action = "walk";
        } 
        else {
            action = "idle";
        }

        return {
            position: [
                this.collider.start.x,
                this.collider.start.y - this.collider.radius,
                this.collider.start.z
            ],
            yaw: Math.atan2(-this.forward.x, -this.forward.z),
            pitch: Math.asin(Math.max(-1, Math.min(1, this.forward.y))),
            action: action
        };
    }

    reset() {
        this.collider.start.copy(this.spawn);
        this.collider.start.y += 0.3;

        this.collider.end.copy(this.spawn);
        this.collider.end.y += 1.5;

        this.velocity.set(0, 0, 0);
        this.onFloor = false;

        this.camera.position.copy(this.collider.end);
        this.camera.rotation.set(0, 0, 0);
    }

    update(delta) {
        if (!this.controls.isLocked) {
            this.stamina = Math.min(100, this.stamina + Math.min(delta, 0.1) * 15);
        }
        if (!this.controls.isLocked || !this.world) {
            return;
        }

        const step = Math.min(delta, 0.05) / 5;

        for (let index = 0; index < 5; index++) {
            this.move(step);
        }

        this.camera.position.copy(this.collider.end);

        if (this.camera.position.y < this.spawn.y - 20) {
            this.reset();
        }
    }

    move(delta) {
        this.camera.getWorldDirection(this.forward);
        this.forward.y = 0;
        this.forward.normalize();
        this.right.crossVectors(this.forward, this.camera.up).normalize();

        this.direction.set(0, 0, 0);

        if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) {
            this.direction.add(this.forward);
        }
        if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) {
            this.direction.sub(this.forward);
        }
        if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) {
            this.direction.add(this.right);
        }
        if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) {
            this.direction.sub(this.right);
        }

        this.direction.normalize();


        if (this.exhausted && this.stamina >= 25) {
            this.exhausted = false;
        }

        const shiftPressed = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");

        const isMoving = this.direction.lengthSq() > 0;
        const running = shiftPressed && isMoving && !this.exhausted && this.stamina > 0;

        if (running) {
            this.stamina -= delta * 22;
        } 
        else {
            this.stamina += delta * 15;
        }
        if (this.stamina < 0) {
            this.stamina = 0;
        }
        if (this.stamina > 100) {
            this.stamina = 100;
        }
        if (this.stamina === 0) {
            this.exhausted = true;
        }

        let speed;
        if (running) {
            speed = this.runSpeed;
        } 
        else {
            speed = this.walkSpeed;
        }

        this.velocity.x = this.direction.x * speed;
        this.velocity.z = this.direction.z * speed;
        this.velocity.y -= this.gravity * delta;
        this.movement.copy(this.velocity);
        this.movement.multiplyScalar(delta);

        this.collider.translate(this.movement);
        this.onFloor = false;

        for (let index = 0; index < 3; index++) {
            const collision = this.world.capsuleIntersect(this.collider);
            if (!collision) {
                break;
            }

            if (collision.normal.y > 0.5){
                 this.onFloor = true;
            }

            const velocityIntoSurface = this.velocity.dot(collision.normal);

            if (velocityIntoSurface < 0) {
                this.velocity.addScaledVector(collision.normal, -velocityIntoSurface);
            }

            this.collider.translate(collision.normal.multiplyScalar(collision.depth));
        }
    }

    dispose() {
        this.disposed = true;
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("blur", this.onBlur);
        document.removeEventListener("pointerlockerror", this.onPointerError);

        this.controls.removeEventListener("lock", this.onLock);
        this.controls.removeEventListener("unlock", this.onUnlock);
        this.controls.unlock();
        this.controls.dispose();
        this.keys.clear();
    }
}
