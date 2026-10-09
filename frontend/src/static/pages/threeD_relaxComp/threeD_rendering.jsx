import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ACESFilmicToneMapping, TextureLoader } from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { MeshoptDecoder } from "meshoptimizer";
import { NavigationBar } from "../components/navBar.jsx";
import { Player } from "./playerController.js";
import "../../css_styles/css_threeD_render_comp/threeD_rendering.css";
import textureBindings from "./roomTextures.json";
import pauseIcon from "../../../assets/icons/pause_icon.png";
import playIcon from "../../../assets/icons/play_icon.png";
import MusicConfiguration from "./music_configuration.js";
import {RemotePlayers, useRoomMultiplayer} from "./roomMultiplayer.jsx";

const TEXTURE_PATH = `${import.meta.env.BASE_URL}3d_models/CDLC_room/textures/`;
const MODEL_PATH = `${import.meta.env.BASE_URL}3d_models/CDLC_room/room.glb`;
const TEXTURE_FILES = [...new Set(Object.values(textureBindings).flatMap(slots => Object.values(slots).map(texture => texture.file)))];
const TEXTURE_URLS = TEXTURE_FILES.map(file => TEXTURE_PATH + file);

const PLAYER_SPAWN = [0, 0.1, 0];
const SFX_PATH = "";

// Here I will enable the lights using on the ceiling
RectAreaLightUniformsLib.init();

function RoomLighting() {
    return (
        <>
            <hemisphereLight args={["#eef4ff", "#b3a592", 1.4]}/>
            {/* Customizing the ceiling light */}
            {[-3, -12, -21].map(z => (
                <rectAreaLight key={z} position={[0, 3.8, z]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    width={14} height={6} color="#fff2df" intensity={4}/>
            ))}

            <directionalLight position={[6, 3.6, -6]} color="#fff6e8" intensity={1.8}
                castShadow shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-18} shadow-camera-right={18}
                shadow-camera-top={18} shadow-camera-bottom={-18}
                shadow-camera-near={0.1} shadow-camera-far={50}
                shadow-normalBias={0.02} shadow-bias={-0.0001}/>
        </>
    );
}

function RoomModel({onReady, onActiveChange, onError, socketRef}) {
    const { scene: source } = useLoader(GLTFLoader, MODEL_PATH, loader => {
        loader.setMeshoptDecoder(MeshoptDecoder);
    });

    const textures = useLoader(TextureLoader, TEXTURE_URLS);
    const {camera, gl} = useThree();
    const playerRef = useRef(null);
    const lastSend = useRef(0);

    const model = useMemo(() => {
        const scene = source.clone(true);
        scene.scale.setScalar(0.01);
        const materials = new Map();
        
        function PrepareMaterial(original) {
            if (materials.has(original)) {
                return materials.get(original);
            }
            const material = original.clone();
            
            for (const [slot, settings] of Object.entries(textureBindings[original.name] || {})) {
                const texture = textures[TEXTURE_FILES.indexOf(settings.file)].clone();
                texture.repeat.fromArray(settings.repeat);
                texture.offset.fromArray(settings.offset);
                texture.wrapS = settings.wrapS;
                texture.wrapT = settings.wrapT;
                texture.colorSpace = settings.colorSpace;
                texture.flipY = settings.flipY;
                texture.needsUpdate = true;
                material[slot] = texture;
            }

            materials.set(original, material);
            return material;
        }

        scene.traverse(object => {
            if (object.isLight) object.visible = false;

            if (object.isMesh) {
                object.material = Array.isArray(object.material)
                    ? object.material.map(PrepareMaterial) : PrepareMaterial(object.material);
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });

        return scene;
    }, [source, textures]);

    useEffect(() => {
        gl.shadowMap.needsUpdate = true;
    }, [gl, model]);

    useEffect(() => {
        const player = new Player(camera, gl.domElement, model, PLAYER_SPAWN, onActiveChange);
        playerRef.current = player;
        let cancelled = false;

        player.ready.then(() => {
            if (!cancelled) {
                onReady(player);
            }
        }).catch(error => {
            if (!cancelled) {
                console.error("Collision setup failed", error);
                onError("Cannot control");
            }
        });

        return () => {
            cancelled = true;
            player.dispose();
            playerRef.current = null;
            onReady(null);
        };
    }, [camera, gl, model, onReady, onActiveChange, onError]);

    useFrame((state, delta) => {
        playerRef.current?.update(delta);
        if (playerRef.current?.world && socketRef.current?.connected && state.clock.elapsedTime - lastSend.current >= 0.05) {
            lastSend.current = state.clock.elapsedTime;

            {/* When player move this should make other players see too */}
            socketRef.current.volatile.emit("player:move", playerRef.current.getNetworkState());
        }
    });

    return <primitive object={model} scale={0.01} position={[0, 0, 0]} dispose={null}/>;
}

export default function Render3DModel() {
    const [player, SetPlayer] = useState(null);
    const [loadError, SetLoadError] = useState("");
    const [active, SetActive] = useState(false);
    const [showMusic, SetShowMusic] = useState(false);
    const [showMaps, SetShowMaps] = useState(false);
    const [chatText, SetChatText] = useState("");
    const [stats, SetStats] = useState({health: 100, stamina: 100});
    const [messages, SetMessages] = useState(["Welcome to the CDLC room.", "Click Enter room to begin."]);
    const AddMessage = useCallback(message => {
        SetMessages(previous => [...previous.slice(-19), message]);
    }, []);
    const multiplayer = useRoomMultiplayer(AddMessage);

    useEffect(() => {
        if (!player || !multiplayer.self){
             return;
        }

        player.spawn.fromArray(multiplayer.self.position);
        player.reset();
    }, [player, multiplayer.self]);

    const soundRef = useRef(null);
    const logRef = useRef(null);
    const chatRef = useRef(null);
    const wantsChat = useRef(false);

    useEffect(() => {
        useLoader.preload(TextureLoader, TEXTURE_URLS);
    }, []);

    useEffect(() => {
        if (!player) {
            return;
        }
    
        const timer = window.setInterval(() => {
            const health = Math.round(player.health);
            const stamina = Math.round(player.stamina);
            SetStats(previous =>
                previous.health === health && previous.stamina === stamina? previous : {health, stamina}
            );
        }, 100);

        return () => window.clearInterval(timer);
    }, [player]);

    {/* Holding alt to enable the mouse or press esc*/}
    useEffect(() => {
        if (!player) return;

        function ToggleMouse(event) {
            if (event.code !== "AltLeft") {
                return;
            }

            event.preventDefault();

            if (event.repeat) {
                return;
            }

            if (player.controls.isLocked) {
                player.pause();
            } 
            else {
                player.start();
            }
        }

        window.addEventListener("keydown", ToggleMouse);

        return () => {
            window.removeEventListener("keydown", ToggleMouse);
        };
    }, [player]);

    useEffect(() => {
        if (!active && wantsChat.current) {
            wantsChat.current = false;
            chatRef.current?.focus();
        }

    }, [active]);

    function SendChat(event) {
        event.preventDefault();
        const text = chatText.trim();

        if (!text) {
             return;
        }

        if (!multiplayer.socketRef.current?.connected) {
            AddMessage("Chat is unavailable while disconnected.");
            return;
        }
        multiplayer.socketRef.current.timeout(5000).emit("chat:send", text, (error, result) => {
            if (error || !result?.success) AddMessage("Message was not delivered. Wait a moment and try again.");
        });
        SetChatText("");
        chatRef.current?.focus();
    }

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [messages]);

    function ToggleMusic() {
        player?.pause();
        SetShowMaps(false);
        SetShowMusic(previous => !previous);
    }

    async function PlaySound() {
        if (!soundRef.current) return;

        try {
            soundRef.current.currentTime = 0;
            await soundRef.current.play();
        } 
        catch {
            AddMessage("Sound cannot play");
        }
    }

    function ResetPlayer() {
        player?.reset();
        SetShowMaps(false);
        AddMessage("Returned to the room entrance.");
    }

    return (
        <Fragment>
            <div id="three-d-layout" className="three-d-layout">
                <header id="three-d-navigation" className="three-d-navigation"><NavigationBar/></header>

                <main id="three-d-page" className="three-d-page">
                    <section id="three-d-container" className="three-d-container" aria-label="CDLC room walkthrough">
                        
                        <Canvas id="three-d-canvas" className="three-d-canvas" dpr={1} shadows
                            camera={{position: [0, 1.6, 0], fov: 70, near: 0.05, far: 1000}}
                            gl={{antialias: false, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.25}}
                            onCreated={({gl}) => { gl.shadowMap.autoUpdate = false; }}>
                            <color attach="background" args={["#dddddd"]}/>
                            
                            {/* Added the room lightning component into this file */}
                            <RoomLighting/>

                            <Suspense fallback={<Html center><div className="three-d-loading">Loading room and collisions...</div></Html>}>
                                <RoomModel onReady={SetPlayer} onActiveChange={SetActive} onError={SetLoadError} socketRef={multiplayer.socketRef}/>
                                <RemotePlayers players={multiplayer.players} remoteStates={multiplayer.remoteStates}/>
                            </Suspense>
                        </Canvas>

                        <div className="three-d-hud">
                            {!player && (
                                <div className="three-d-loading-status" role={loadError ? "alert" : "status"}>
                                    {loadError || "Loading room"}
                                </div>
                            )}
                            <div className="three-d-player-info">
                                <div className="three-d-avatar" style={{background: multiplayer.self?.color}} aria-label="Your player color">{multiplayer.self?.displayName?.[0]?.toUpperCase() || "P"}</div>
                                <div className="three-d-status">
                                    <div className="three-d-network-status" role="status">
                                        {multiplayer.self ? `${multiplayer.self.displayName} ${multiplayer.players.length + 1} is in CDLC` : multiplayer.status}
                                    </div>
                                    <div className="three-d-status-bar three-d-status-health" role="progressbar" aria-label="Health" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.health}>
                                        <span className="three-d-bar-fill" style={{width: `${stats.health}%`}}/>
                                        {/*<span className="three-d-bar-label">HEALTH {stats.health}/100</span>*/}
                                    </div>
                                    <div className="three-d-status-bar three-d-status-stamina" role="progressbar" aria-label="Stamina" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.stamina}>
                                        <span className="three-d-bar-fill" style={{width: `${stats.stamina}%`}}/>
                                        {/*<span className="three-d-bar-label">STAMINA {stats.stamina}/100</span>*/}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Pause and Play button */}
                            <button className="three-d-pause" type="button" disabled={!player} onClick={() => active ? player.pause() : player.start()} aria-label={active ? "Pause walkthrough" : "Resume walkthrough"}>
                                <img className="three-d-pause-image" src={active ? pauseIcon : playIcon} alt="" aria-hidden="true"/>
                            </button>

                            {player && (
                                <div className="three-d-side-actions">
                                    <button className="three-d-action-button" type="button" onClick={ToggleMusic}>Room music</button>
                                    
                                    <button className="three-d-action-button" type="button" disabled={!SFX_PATH} onClick={PlaySound}>Play SFX</button>
                                    <button className="three-d-action-button" type="button" onClick={() => { player.pause(); SetShowMusic(false); SetShowMaps(previous => !previous); }}>Reset position</button>
                                </div>
                            )}

                            {!active && player && !showMusic && !showMaps && (
                                <div className="three-d-start-panel">
                                    <h2 className="three-d-start-title">Welcome to CDLC room</h2>
                                    <p className="three-d-start-description">WASD to walk, Shift to run, and Space to Jump</p>
                                    <p className="three-d-start-description">Mouse turning to look, ESC to pause, and R to reset</p>
                                    <button className="three-d-enter-button" type="button" onClick={() => player.start()}>Enter room</button>
                                    <p className="three-d-mobile-notice">Walking controls require a keyboard and mouse.</p>
                                </div>
                            )}

                            {showMaps && !active && (
                                <div className="three-d-map-panel">
                                    <h2 className="three-d-map-title">Choose room</h2>
                                    <p className="three-d-map-description">Only CDLC room and CoE building available</p>
                                    <button className="three-d-action-button" type="button" disabled={!player} onClick={ResetPlayer}>CDLC — reset position</button>
                                    <button className="three-d-close-button" type="button" onClick={() => SetShowMaps(false)}>Close</button>
                                </div>
                            )}

                            {active && <div className="three-d-crosshair" aria-hidden="true">+</div>}

                            <aside className="three-d-log">
                                <h2 className="three-d-log-title">Welcome to the CDLC room</h2>
                                <div className="three-d-log-messages" ref={logRef} aria-live="polite">
                                    {messages.map((message, index) => <p className="three-d-log-message" key={index}>{message}</p>)}
                                </div>
                                <form className="three-d-chat-form" onSubmit={SendChat}>
                                    <input ref={chatRef} className="three-d-chat-input" aria-label="Chat message"
                                        placeholder={active ? "Type anything here >>>" : "Type anything here >>> "}
                                        value={chatText} maxLength={300} onChange={event => SetChatText(event.target.value)}/>
                                    <button type="submit" disabled={!chatText.trim() || !multiplayer.self}>Send</button>
                                </form>
                            </aside>


                            <MusicConfiguration
                                open={showMusic && !active}
                                onClose={() => SetShowMusic(false)}
                            />
                        </div>
                    </section>

                    {SFX_PATH && <audio className="three-d-audio" ref={soundRef} src={SFX_PATH} preload="none"/>}
                </main>
            </div>
        </Fragment>
    );
}
