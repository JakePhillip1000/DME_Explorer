import {useEffect, useRef, useState} from "react";
import {useFrame} from "@react-three/fiber";
import {Html} from "@react-three/drei";
import {io} from "socket.io-client";

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "").replace(/\/$/, "");

export function useRoomMultiplayer(onMessage) {
    const socketRef = useRef(null);
    const remoteStates = useRef(new Map());
    const [players, setPlayers] = useState([]);
    const [self, setSelf] = useState(null);
    const [status, setStatus] = useState("Connecting to room...");

    useEffect(() => {
        const socket = io(`${API_ORIGIN}/relax-room`, {withCredentials: true, autoConnect: false});
        socketRef.current = socket;

        socket.on("room:welcome", ({self: currentPlayer, players: roster}) => {
            remoteStates.current = new Map(roster.filter(player => player.id !== currentPlayer.id).map(player => [player.id, player]));
            setPlayers([...remoteStates.current.values()]);
            setSelf(currentPlayer);
            setStatus("Connected");
            onMessage(`Joined as ${currentPlayer.displayName}.`);
        });

        socket.on("player:joined", player => {
            remoteStates.current.set(player.id, player);
            setPlayers([...remoteStates.current.values()]);
            onMessage(`${player.displayName} joined the room.`);
        });

        socket.on("player:moved", player => {
            if (remoteStates.current.has(player.id)){
                 remoteStates.current.set(player.id, player);
            }
        });

        socket.on("player:left", player => {
            remoteStates.current.delete(player.id);
            setPlayers([...remoteStates.current.values()]);
            onMessage(`${player.displayName} left the room.`);
        });

        socket.on("chat:message", message => onMessage(`${message.displayName}: ${message.text}`));
        socket.on("connect_error", () => setStatus("Cannot connect to room. Retrying..."));
        socket.on("disconnect", () => {
            remoteStates.current.clear();
            setPlayers([]);
            setSelf(null);
            setStatus("Disconnected. Reconnecting...");
        });

        const leave = () => socket.disconnect();
        const resume = () => socket.connect();
        window.addEventListener("pagehide", leave);
        window.addEventListener("pageshow", resume);
        socket.connect();
        return () => {
            window.removeEventListener("pagehide", leave);
            window.removeEventListener("pageshow", resume);
            socket.removeAllListeners();
            socket.disconnect();
            remoteStates.current.clear();
            socketRef.current = null;
        };
    }, [onMessage]);

    return {socketRef, remoteStates, players, self, status};
}

function RemotePlayer({player, remoteStates}) {
    const root = useRef(null);
    const head = useRef(null);
    const body = useRef(null);

    useFrame((state, delta) => {
        const target = remoteStates.current.get(player.id);
        if (!target || !root.current) return;
        const blend = 1 - Math.exp(-15 * delta);
        const distance = Math.hypot(...target.position.map((value, index) => value - root.current.position.getComponent(index)));
        target.position.forEach((value, index) => {
            const current = root.current.position.getComponent(index);
            root.current.position.setComponent(index, distance > 3 ? value : current + (value - current) * blend);
        });
        const angle = target.yaw - root.current.rotation.y;
        root.current.rotation.y += Math.atan2(Math.sin(angle), Math.cos(angle)) * blend;
        head.current.rotation.x += (target.pitch - head.current.rotation.x) * blend;
        const walking = target.action === "walk" || target.action === "run";
        body.current.rotation.z = walking ? Math.sin(state.clock.elapsedTime * (target.action === "run" ? 16 : 10)) * 0.045 : 0;
    });

    return (
        <group ref={root} position={player.position} rotation={[0, player.yaw, 0]}>
            <mesh ref={body} position={[0, 0.9, 0]}>
                <capsuleGeometry args={[0.3, 1.2, 6, 12]}/>
                <meshStandardMaterial color={player.color} roughness={0.65}/>
            </mesh>
            <group ref={head} position={[0, 1.5, 0]}>
                {[-0.1, 0.1].map(x => (
                    <mesh key={x} position={[x, 0.04, -0.28]}>
                        <sphereGeometry args={[0.045, 8, 8]}/>
                        <meshBasicMaterial color="#202020"/>
                    </mesh>
                ))}
            </group>
            <Html position={[0, 2.05, 0]} center distanceFactor={8} zIndexRange={[10, 0]} style={{pointerEvents: "none"}}>
                <div className="three-d-remote-name">
                    <strong>{player.displayName}</strong>
                </div>
            </Html>
        </group>
    );
}

export function RemotePlayers({players, remoteStates}) {
    return players.map(player => <RemotePlayer key={player.id} player={player} remoteStates={remoteStates}/>);
}
