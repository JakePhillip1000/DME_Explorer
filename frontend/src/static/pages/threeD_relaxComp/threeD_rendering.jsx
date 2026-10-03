import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TextureLoader } from "three";
import { MeshoptDecoder } from "meshoptimizer";
import { NavigationBar } from "../components/navBar.jsx";
import { Player } from "./playerController.js";
import "../../css_styles/css_threeD_render_comp/threeD_rendering.css";
import textureBindings from "./roomTextures.json";
import pauseIcon from "../../../assets/icons/pause_icon.png";
import playIcon from "../../../assets/icons/play_icon.png";

const TEXTURE_PATH = `${import.meta.env.BASE_URL}3d_models/CDLC_room/textures/`;
const MODEL_PATH = `${import.meta.env.BASE_URL}3d_models/CDLC_room/room.glb`;
const TEXTURE_FILES = [...new Set(Object.values(textureBindings).flatMap(slots => Object.values(slots).map(texture => texture.file)))];
const TEXTURE_URLS = TEXTURE_FILES.map(file => TEXTURE_PATH + file);

const PLAYER_SPAWN = [0, 0.1, 0];
const MUSIC_PATH = "";
const SFX_PATH = "";

function RoomModel({onReady, onActiveChange, onError}) {
    const { scene: source } = useLoader(GLTFLoader, MODEL_PATH, loader => {
        loader.setMeshoptDecoder(MeshoptDecoder);
    });
    const textures = useLoader(TextureLoader, TEXTURE_URLS);
    const {camera, gl} = useThree();
    const playerRef = useRef(null);

    const model = useMemo(() => {
        const scene = source.clone(true);
        scene.scale.setScalar(0.01);
        const materials = new Map();
        function PrepareMaterial(original) {
            if (materials.has(original)) return materials.get(original);
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
                object.castShadow = false;
                object.receiveShadow = false;
            }
        });

        return scene;
    }, [source, textures]);

    useEffect(() => {
        const player = new Player(camera, gl.domElement, model, PLAYER_SPAWN, onActiveChange);
        playerRef.current = player;
        let cancelled = false;
        player.ready.then(() => {
            if (!cancelled) onReady(player);
        }).catch(error => {
            if (!cancelled) {
                console.error("Room collision setup failed:", error);
                onError("Unable to prepare room controls. Reload the page to try again.");
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
    });

    return <primitive object={model} scale={0.01} position={[0, 0, 0]} dispose={null}/>;
}

export default function Render3DModel() {
    const [player, SetPlayer] = useState(null);
    const [loadError, SetLoadError] = useState("");
    const [active, SetActive] = useState(false);
    const [musicPlaying, SetMusicPlaying] = useState(false);
    const [showMaps, SetShowMaps] = useState(false);
    const [chatText, SetChatText] = useState("");
    const [stats, SetStats] = useState({health: 100, stamina: 100});
    const [messages, SetMessages] = useState(["Welcome to the CDLC room.", "Click Enter room to begin."]);

    const musicRef = useRef(null);
    const soundRef = useRef(null);
    const logRef = useRef(null);
    const chatRef = useRef(null);
    const wantsChat = useRef(false);

    useEffect(() => {
        // Start texture requests while the geometry is still downloading.
        useLoader.preload(TextureLoader, TEXTURE_URLS);
    }, []);

    useEffect(() => {
        if (!player) {
            return;
        }

        const timer = window.setInterval(() => {
            const health = Math.round(player.health);
            const stamina = Math.round(player.stamina);
            SetStats(previous => previous.health === health && previous.stamina === stamina
                ? previous : {health, stamina});
        }, 100);

        function OpenChat(event) {
            if (event.code !== "Enter" || !player.controls.isLocked) return;
            event.preventDefault();
            wantsChat.current = true;
            player.pause();
        }
        window.addEventListener("keydown", OpenChat);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener("keydown", OpenChat);
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
        if (!text) return;
        AddMessage(`You: ${text}`);
        SetChatText("");
        chatRef.current?.focus();
    }

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [messages]);

    function AddMessage(message) {
        SetMessages(previous => [...previous.slice(-19), message]);
    }

    async function ToggleMusic() {
        if (!musicRef.current) return;

        if (musicPlaying) {
            musicRef.current.pause();
            SetMusicPlaying(false);
            return;
        }

        try {
            await musicRef.current.play();
            SetMusicPlaying(true);
        } catch {
            AddMessage("Music could not play. Check the audio file path.");
        }
    }

    async function PlaySound() {
        if (!soundRef.current) return;

        try {
            soundRef.current.currentTime = 0;
            await soundRef.current.play();
        } catch {
            AddMessage("Sound could not play. Check the audio file path.");
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
                        <Canvas id="three-d-canvas" className="three-d-canvas" dpr={1} camera={{position: [0, 1.6, 0], fov: 70, near: 0.05, far: 1000}} gl={{antialias: false}}>
                            <color attach="background" args={["#dddddd"]}/>
                            <hemisphereLight args={["#ffffff", "#777777", 1.2]}/>
                            <directionalLight position={[5, 8, 5]} intensity={1.5}/>

                            <Suspense fallback={<Html center><div className="three-d-loading">Loading room and collisions...</div></Html>}>
                                <RoomModel onReady={SetPlayer} onActiveChange={SetActive} onError={SetLoadError}/>
                            </Suspense>
                        </Canvas>

                        <div className="three-d-hud">
                            {!player && (
                                <div className="three-d-loading-status" role={loadError ? "alert" : "status"}>
                                    {loadError || "Loading room"}
                                </div>
                            )}
                            <div className="three-d-player-info">
                                <div className="three-d-avatar" aria-label="Player avatar placeholder">P</div>
                                <div className="three-d-status">
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
                                    <button className="three-d-action-button" type="button" disabled={!MUSIC_PATH} onClick={ToggleMusic}>{musicPlaying ? "Pause music" : "Play music"}</button>
                                    <button className="three-d-action-button" type="button" disabled={!SFX_PATH} onClick={PlaySound}>Play SFX</button>
                                    <button className="three-d-action-button" type="button" onClick={() => { player.pause(); SetShowMaps(previous => !previous); }}>Reset position</button>
                                </div>
                            )}

                            {!active && player && (
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
                                    <p className="three-d-map-description">Only the CDLC model is currently configured.</p>
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
                                    <button type="submit" disabled={!chatText.trim()}>Send</button>
                                </form>
                            </aside>


                            <p className="three-d-music-label">Now playing: {musicPlaying ? "Room music" : "No music"}</p>
                        </div>
                    </section>

                    {MUSIC_PATH && <audio className="three-d-audio" ref={musicRef} src={MUSIC_PATH} loop preload="none"/>}
                    {SFX_PATH && <audio className="three-d-audio" ref={soundRef} src={SFX_PATH} preload="none"/>}
                </main>
            </div>
        </Fragment>
    );
}
