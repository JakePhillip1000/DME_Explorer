import express from "express";
import cors from "cors";
import session from "express-session";
import { SupabaseSessionStore } from "./session_store.js";
import multer from "multer";
import "dotenv/config";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { Server } from "socket.io";
import { SetupRoomMultiplayer } from "./pages_backend/room_multiplayer_controller.js";

import { RegisterUser } from "./register_login_validation/register_controller.js";
import { LoginUser } from "./register_login_validation/login_controller.js";
import { GetAllNews, CreateNews, UpdateNews, IsAdmin, ConvertNewsImage } from "./pages_backend/news_modify.js";

import contactsController from "./pages_backend/contacts_controller.js";
import newsController from "./pages_backend/news_controller.js";
import KkuLecturerController from "./pages_backend/coE_professor_controller.js";
import adminContactController from "./pages_backend/admin_contact_controller.js";
import threeDPageController from "./pages_backend/threeD_pageController.js";
import projectController from "./pages_backend/project_controller.js";
import occupationController from "./pages_backend/occupation_controller.js";

const app = express();
const onVercel = process.env.VERCEL === "1";
if (onVercel && !process.env.SESSION_SECRET) {
    throw new Error("Set SESSION_SECRET in Vercel environment variables.");
}
app.set("trust proxy", 1);
app.get("/api/health", (req, res) => res.json({ok: true}));

const lanOrigins = Object.values(networkInterfaces()).flat()
    .filter(a => a.family === "IPv4" && !a.internal)
    .map(a => `http://${a.address}:5173`);

const allowedOrigins = [...new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...lanOrigins,
    ...(process.env.FRONTEND_ORIGIN || "").split(",").map(o => o.trim()).filter(Boolean)
])];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

const sessionMiddleware = session({
    store: onVercel ? new SupabaseSessionStore() : undefined,
    secret: process.env.SESSION_SECRET || "DmeExplorer_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: onVercel,
        sameSite: "lax",
        maxAge: 3600000
    }
});

app.use(sessionMiddleware);

export function createAppServer() {
    const server = createServer(app);
    const io = new Server(server, {
        cors: {origin: allowedOrigins, credentials: true},
        path: "/api/index",
        addTrailingSlash: false,
        transports: ["websocket"],
        allowRequest: (req, done) => {
            const origin = req.headers.origin;
            const sameHost = origin === `https://${req.headers.host}` || origin === `http://${req.headers.host}`;
            done(null, !origin || sameHost || allowedOrigins.includes(origin));
        },
        maxHttpBufferSize: 16 * 1024,
        pingInterval: 10000,
        pingTimeout: 10000
    });
    io.engine.use(sessionMiddleware);
    const cleanupRoom = SetupRoomMultiplayer(io);
    server.on("close", cleanupRoom);
    return server;
}

// Register system
app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password, passwordConfirmation } = req.body;
        const result = await RegisterUser(username, email, password, passwordConfirmation);

        return res.status(result.success ? 201 : result.status || 400).json(result);
    } 
    
    catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Login system
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await LoginUser(username, password);

        if (!result.success) {
            return res.status(result.status || 400).json(result);
        }

        await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
        req.session.user = {
            id: result.user.id,
            username: result.user.username
        };

        await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
        return res.status(200).json(result);
    } 
    catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Session variable -- the user current login
app.get("/api/session", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            loggedIn: false,
            message: "No one login"
        });
    }

    return res.status(200).json({
        loggedIn: true,
        user: req.session.user
    });
});

// The news controller --> uploading news to supabase
app.use("/api/news", newsController);

// The contact page controller
app.use("/api/contacts", contactsController);
app.use("/api/admin/contacts", adminContactController);

// Get the KKU professor information route via API
app.get("/api/kku-lecturers", KkuLecturerController.GetLecturers);

// 3D scene page, controller
app.use("/api/three-d", threeDPageController);

// project controller
app.use("/api/projects", projectController);

// occupation controller --> job listings
app.use("/api/occupation", occupationController);

// The logout backend side
app.post("/api/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to logout."
            });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({
            success: true,
            message: "Logout successful."
        });
    });
});

app.use("/api", (req, res) => res.status(404).json({message: "API route not found."}));
app.use((error, req, res, next) => {
    console.error("API error:", error.message);
    if (res.headersSent) return next(error);
    res.status(500).json({message: "The server could not complete this request."});
});
if (!onVercel) {
    const port = Number(process.env.PORT) || 5000;
    createAppServer().listen(port, () => console.log(`Server started on port ${port}`));
}
export default app;

