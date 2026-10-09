const ROOM = "cdlc-room";

const ACTIONS = new Set(["idle", "walk", "run", "jump","paused"]);

const ValidPosition = (position) => {
    if (!Array.isArray(position)) {
        return false;
    }

    if (position.length !== 3) {
        return false;
    }

    for (const value of position) {
        if (!Number.isFinite(value) || Math.abs(value) > 1000) {
            return false;
        }
    }

    return true;
}

export function SetupRoomMultiplayer(io) {
    const room = io.of("/relax-room");
    const players = new Map();

    let appearance = 0;

    room.on("connection", socket => {
        const username = socket.request.session?.user?.username;

        let displayName = "";

        if (typeof username === "string") {
            displayName = username.trim();
        }

        if (!displayName) {
            const names = new Set();

            for (const player of players.values()) {
                names.add(player.displayName);
            }

            let guest = 0;

            while (names.has(displayName) || guest === 0) {
                if (guest === 0) {
                    displayName = "guest";
                } 
                else {
                    displayName = "guest" + guest;
                }

                guest++;

                if (!names.has(displayName)) {
                    break;
                }
            }
        }

        const number = appearance;
        appearance++;

        let colorNumber = Math.round(number * 137.508) % 360;

        const color = `hsl(${colorNumber}, 65%, 55%)`; // here I will assign color based on the person joined

        const positionX = ((number % 3) - 1) * 0.8;
        const positionZ = -(Math.floor(number / 3) % 3) * 0.8;

        const player = {
            id: socket.id,
            displayName: displayName,
            color: color,
            position: [positionX, 0.1, positionZ],
            yaw: 0,
            pitch: 0,
            action: "paused"
        };

        players.set(socket.id, player);

        socket.join(ROOM);

        socket.emit("room:welcome", {
            self: player,
            players: [...players.values()]
        });

        socket.to(ROOM).emit("player:joined", player);

        let lastMove = 0;
        let lastChat = 0;

        socket.on("player:move", data => {
            const now = Date.now();

            if (now - lastMove < 40) {
                return;
            }

            if (!ValidPosition(data?.position)) {
                return;
            }

            if (!Number.isFinite(data?.yaw)) {
                return;
            }

            if (!Number.isFinite(data?.pitch)) {
                return;
            }

            if (!ACTIONS.has(data?.action)) {
                return;
            }

            lastMove = now;

            player.position = [...data.position];
            player.yaw = Math.atan2(Math.sin(data.yaw), Math.cos(data.yaw));
            player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, data.pitch));
            player.action = data.action;

            socket.to(ROOM).volatile.emit("player:moved", player);
        });

        socket.on("chat:send", (value, acknowledge) => {
            let text = "";

            if (typeof value === "string") {
                text = value.trim();
            }

            const now = Date.now();

            if (!text || text.length > 300 || now - lastChat < 700) {
                if (typeof acknowledge === "function") {
                    acknowledge({
                        success: false
                    });
                }

                return;
            }

            lastChat = now;

            room.to(ROOM).emit("chat:message", {
                id: socket.id,
                displayName: displayName,
                text: text
            });

            if (typeof acknowledge === "function") {
                acknowledge({
                    success: true
                });
            }
        });

        socket.on("disconnect", () => {
            players.delete(socket.id);

            socket.to(ROOM).emit("player:left", {
                id: socket.id,
                displayName: displayName
            });
        });
    });
}

