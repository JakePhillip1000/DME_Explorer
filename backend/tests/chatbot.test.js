import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import chatbot, { CHAT_REQUEST_LIMIT } from "../pages_backend/chatbot_controller.js";

test("DME BOT chat endpoint", async t => {
    const originalFetch = globalThis.fetch;
    const originalKey = process.env.GEMINI_API_KEY;
    const originalModel = process.env.GEMINI_MODEL;
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-3.5-flash-lite";

    const app = express();
    app.use(express.json());
    app.use("/api/contacts/chat", chatbot);
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(async () => {
        globalThis.fetch = originalFetch;
        if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalKey;
        if (originalModel === undefined) delete process.env.GEMINI_MODEL;
        else process.env.GEMINI_MODEL = originalModel;
        await new Promise(resolve => server.close(resolve));
    });

    let requestCount = 0;
    async function send(body) {
        requestCount++;
        const response = await originalFetch(`http://127.0.0.1:${server.address().port}/api/contacts/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        return { status: response.status, body: await response.json() };
    }

    await t.test("returns an answer and forwards conversation roles", async () => {
        globalThis.fetch = async (url, options) => {
            const request = JSON.parse(options.body);
            assert.deepEqual(request.contents.map(item => item.role), ["user", "model", "user"]);
            assert.equal(request.contents[2].parts[0].text, "What can I study?");
            return Response.json({ candidates: [{ content: { parts: [
                { thought: true, text: "Internal reasoning" },
                { text: "DME covers digital media and engineering." }
            ] } }] });
        };
        const result = await send({ message: " What can I study? ", history: [
            { role: "user", text: "Hello" }, { role: "model", text: "How can I help?" }
        ] });
        assert.equal(result.status, 200);
        assert.equal(result.body.reply, "DME covers digital media and engineering.");
    });

    await t.test("rejects empty messages and invalid history", async () => {
        assert.equal((await send({ message: " " })).status, 400);
        assert.equal((await send({ message: "Hi", history: [{ role: "system", text: "bad" }] })).status, 400);
    });

    await t.test("reports a missing API key", async () => {
        delete process.env.GEMINI_API_KEY;
        assert.equal((await send({ message: "Hi" })).status, 503);
        process.env.GEMINI_API_KEY = "test-key";
    });

    await t.test("handles upstream quota, empty answers, network errors and timeouts", async () => {
        globalThis.fetch = async () => new Response("", { status: 429 });
        assert.equal((await send({ message: "Hi" })).status, 429);
        globalThis.fetch = async () => Response.json({ candidates: [] });
        assert.equal((await send({ message: "Hi" })).status, 502);
        globalThis.fetch = async () => { throw new Error("Network unavailable"); };
        assert.equal((await send({ message: "Hi" })).status, 502);
        globalThis.fetch = async () => { throw new DOMException("Timed out", "AbortError"); };
        assert.equal((await send({ message: "Hi" })).status, 504);
    });

    await t.test("retries temporary failures once", async () => {
        let attempts = 0;
        globalThis.fetch = async () => {
            attempts++;
            if (attempts === 1) return new Response("Unavailable", { status: 503 });
            return Response.json({ candidates: [{ content: { parts: [{ text: "Hello from DME BOT" }] } }] });
        };
        const result = await send({ message: "Hi" });
        assert.equal(result.status, 200);
        assert.equal(result.body.reply, "Hello from DME BOT");
        assert.equal(attempts, 2);
    });

    await t.test("explains unavailable models without retrying", async () => {
        let attempts = 0;
        globalThis.fetch = async () => {
            attempts++;
            return Response.json({ error: { status: "NOT_FOUND" } }, { status: 404 });
        };
        const result = await send({ message: "Hi" });
        assert.equal(result.status, 502);
        assert.match(result.body.message, /model.*unavailable/i);
        assert.equal(attempts, 1);
    });

    await t.test("limits repeated requests", async () => {
        while (requestCount < CHAT_REQUEST_LIMIT) {
            const result = await send({ message: " " });
            assert.equal(result.status, 400);
        }
        const result = await send({ message: "Hi" });
        assert.equal(result.status, 429);
        assert.equal(result.body.success, false);
    });
});
