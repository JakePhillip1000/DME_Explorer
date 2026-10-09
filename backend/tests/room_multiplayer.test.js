import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {once} from "node:events";
import express from "express";
import session from "express-session";
import {Server} from "socket.io";
import {io as connect} from "../../frontend/node_modules/socket.io-client/build/esm/index.js";
import {SetupRoomMultiplayer} from "../pages_backend/room_multiplayer_controller.js";

function nextEvent(socket, event) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 3000);
        socket.once(event, value => { clearTimeout(timer); resolve(value); });
    });
}

test("room membership, session identity, actions, chat and leaving", async t => {
    const app = express();
    const sessions = session({secret: "test-only-secret", resave: false, saveUninitialized: false});
    app.use(sessions);
    // Test-only login: production identity comes from the existing login route.
    app.get("/login", (req, res) => {
        req.session.user = {id: 1, username: "DME Student"};
        res.json({success: true});
    });
    const server = createServer(app);
    const io = new Server(server);
    io.engine.use(sessions);
    SetupRoomMultiplayer(io);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const origin = `http://127.0.0.1:${server.address().port}`;
    const clients = [];
    t.after(async () => {
        clients.forEach(client => client.disconnect());
        await new Promise(resolve => io.close(resolve));
    });

    async function join(cookie) {
        const socket = connect(`${origin}/relax-room`, {
            autoConnect: false, forceNew: true, reconnection: false,
            transports: ["websocket"], extraHeaders: cookie ? {Cookie: cookie} : {}
        });
        clients.push(socket);
        const welcome = nextEvent(socket, "room:welcome");
        socket.connect();
        return {socket, welcome: await welcome};
    }

    const first = await join();
    assert.equal(first.welcome.self.displayName, "guest");
    const joined = nextEvent(first.socket, "player:joined");
    const second = await join();
    assert.equal(second.welcome.self.displayName, "guest1");
    assert.equal(second.welcome.players.length, 2);
    assert.notEqual(first.welcome.self.color, second.welcome.self.color);
    assert.equal((await joined).id, second.socket.id);

    const login = await fetch(`${origin}/login`);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const loggedIn = await join(cookie);
    assert.equal(loggedIn.welcome.self.displayName, "DME Student");

    const moved = nextEvent(first.socket, "player:moved");
    second.socket.emit("player:move", {position: [2, 1, -3], yaw: 1, pitch: 0.2, action: "jump", displayName: "Fake admin"});
    const movement = await moved;
    assert.deepEqual(movement.position, [2, 1, -3]);
    assert.equal(movement.action, "jump");
    assert.equal(movement.displayName, "guest1");
    assert.equal(movement.pitch, 0.2);

    const chat = nextEvent(first.socket, "chat:message");
    second.socket.emit("chat:send", "Hello room");
    assert.deepEqual(await chat, {id: second.socket.id, displayName: "guest1", text: "Hello room"});

    // A new visitor must receive the most recent position, not the spawn position.
    const fourth = await join();
    assert.equal(fourth.welcome.self.displayName, "guest2");
    assert.deepEqual(fourth.welcome.players.find(player => player.id === second.socket.id).position, [2, 1, -3]);
    const left = nextEvent(first.socket, "player:left");
    const oldId = second.socket.id;
    second.socket.disconnect();
    assert.equal((await left).id, oldId);
    const replacement = await join();
    assert.equal(replacement.welcome.self.displayName, "guest1");
    assert.equal(replacement.welcome.players.some(player => player.id === oldId), false);
});
