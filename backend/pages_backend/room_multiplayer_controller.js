import {randomUUID} from "node:crypto";
import supabase from "../supabase_client.js";

const ACTIONS = new Set(["idle", "walk", "run", "jump", "paused"]);
const validPosition = p => Array.isArray(p) && p.length === 3 && p.every(v => Number.isFinite(v) && Math.abs(v) <= 1000);

export function SetupRoomMultiplayer(io, {channelName = "cdlc-room-v1"} = {}) {
    const room = io.of("/relax-room");
    const localPlayers = new Map();
    const players = new Map();
    const dirty = new Map();
    const instance = randomUUID();
    let channel;
    let ready;
    let timer;
    let tracking = Promise.resolve();
    let closing = false;

    // Private server-to-server channel: no database keys are sent to browsers.
    const broadcast = (event, payload) => channel
        ? channel.send({type: "broadcast", event, payload}) : Promise.resolve("error");
    function trackPlayers() {
        tracking = tracking.catch(() => {}).then(() => channel?.track({players: [...localPlayers.values()]}));
        return tracking;
    }

    function connectSharedRoom() {
        if (ready) return ready;
        channel = supabase.channel(channelName, {
            config: {private: true, presence: {key: instance}, broadcast: {self: false, ack: true}}
        });
        const activeChannel = channel;
        channel.on("presence", {event: "sync"}, () => {
            const roster = new Map();
            for (const state of Object.values(channel.presenceState()).flat()) {
                for (const player of state.players || []) roster.set(player.id, players.get(player.id) || player);
            }
            for (const player of localPlayers.values()) roster.set(player.id, player);
            players.clear();
            for (const [id, player] of roster) players.set(id, player);
            room.emit("room:roster", [...players.values()]);
        });
        channel.on("broadcast", {event: "movement"}, ({payload}) => {
            for (const player of payload) {
                if (players.has(player.id)) {
                    players.set(player.id, player);
                    room.volatile.emit("player:moved", player);
                }
            }
        });
        channel.on("broadcast", {event: "snapshot"}, () => broadcast("movement", [...localPlayers.values()]));
        channel.on("broadcast", {event: "chat"}, ({payload}) => room.emit("chat:message", payload));
        ready = new Promise((resolve, reject) => {
            channel.subscribe((status, error) => {
                if (channel !== activeChannel || closing) return;
                if (status === "SUBSCRIBED") {
                    trackPlayers().then(() => {
                        broadcast("snapshot", {});
                        resolve();
                    }).catch(reject);
                } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status) && !closing) {
                    reject(new Error("Shared room connection failed: " + status + (error?.message ? " " + error.message : "")));
                    // Reconnect clients if the shared bus fails; never split the room silently.
                    for (const socket of room.sockets.values()) socket.disconnect(true);
                    clearInterval(timer);
                    channel = null;
                    ready = null;
                    supabase.removeChannel(activeChannel);
                }
            });
        });
        timer = setInterval(() => {
            if (!dirty.size) return;
            const updates = [...dirty.values()];
            dirty.clear();
            broadcast("movement", updates);
        }, 100);
        timer.unref();
        return ready;
    }

    room.use(async (socket, next) => {
        try {
            await connectSharedRoom();
            const {data: number, error} = await supabase.rpc("next_room_player_number");
            if (error) throw error;
            const username = socket.request.session?.user?.username;
            socket.data.player = {
                id: socket.id,
                displayName: username || (number === 0 ? "guest" : `guest${number}`),
                color: `hsl(${Math.round(number * 137.508) % 360}, 65%, 55%)`,
                position: [((number % 3) - 1) * 0.8, 0.1, -(Math.floor(number / 3) % 3) * 0.8],
                yaw: 0, pitch: 0, action: "paused"
            };
            next();
        } catch (error) {
            console.error("Room join failed:", error.message);
            next(new Error("Cannot join the shared room. Please retry."));
        }
    });

    room.on("connection", socket => {
        const player = socket.data.player;
        localPlayers.set(socket.id, player);
        players.set(socket.id, player);
        socket.emit("room:welcome", {self: player, players: [...players.values()]});
        socket.broadcast.emit("player:joined", player);
        trackPlayers();
        let lastMove = 0;
        let lastChat = 0;
        socket.on("player:move", data => {
            const now = Date.now();
            if (now - lastMove < 40 || !validPosition(data?.position) || !Number.isFinite(data?.yaw) ||
                !Number.isFinite(data?.pitch) || !ACTIONS.has(data?.action)) return;
            lastMove = now;
            player.position = [...data.position];
            player.yaw = Math.atan2(Math.sin(data.yaw), Math.cos(data.yaw));
            player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, data.pitch));
            player.action = data.action;
            dirty.set(socket.id, {...player});
            socket.broadcast.volatile.emit("player:moved", player);
        });
        socket.on("chat:send", async (value, acknowledge) => {
            const text = typeof value === "string" ? value.trim() : "";
            const now = Date.now();
            if (!text || text.length > 300 || now - lastChat < 700) {
                if (typeof acknowledge === "function") acknowledge({success: false});
                return;
            }
            lastChat = now;
            const message = {id: socket.id, displayName: player.displayName, text};
            const result = await broadcast("chat", message);
            if (result === "ok") room.emit("chat:message", message);
            if (typeof acknowledge === "function") acknowledge({success: result === "ok"});
        });
        socket.on("disconnect", () => {
            localPlayers.delete(socket.id);
            players.delete(socket.id);
            dirty.delete(socket.id);
            socket.broadcast.emit("player:left", player);
            trackPlayers();
        });
    });

    return async () => {
        closing = true;
        clearInterval(timer);
        if (channel) await supabase.removeChannel(channel);
    };
}
