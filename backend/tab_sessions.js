import {randomBytes} from "node:crypto";

export function CreateTabSessions() {
    const sessions = new Map();
    const lifetime = 60 * 60 * 1000;
    const cleanup = setInterval(() => {
        for (const [token, session] of sessions) {
            if (session.expiresAt <= Date.now()) sessions.delete(token);
        }
    }, 60000);
    cleanup.unref();

    function get(token) {
        const session = typeof token === "string" ? sessions.get(token) : null;
        if (!session || session.expiresAt <= Date.now()) {
            sessions.delete(token);
            return null;
        }
        return session;
    }

    return {
        get,
        close: () => clearInterval(cleanup),
        create(user) {
            const token = randomBytes(32).toString("hex");
            sessions.set(token, {user: {id: user.id, username: user.username}, expiresAt: Date.now() + lifetime});
            return token;
        },
        middleware(req, res, next) {
            const authorization = req.headers.authorization || "";
            const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
            req.authToken = token;
            req.session = {
                user: get(token)?.user,
                destroy(callback) {
                    sessions.delete(token);
                    callback();
                }
            };
            next();
        }
    };
}
