import express from "express";
import cors from "cors";
import session from "express-session";
import multer from "multer";

import { RegisterUser } from "./register_login_validation/register_controller.js";
import { LoginUser } from "./register_login_validation/login_controller.js";
import { GetAllNews, CreateNews, UpdateNews, IsAdmin, ConvertNewsImage } from "./pages_backend/news_modify.js";

import contactsController from "./pages_backend/contacts_controller.js";
import newsController from "./pages_backend/news_controller.js";
import KkuLecturerController from "./pages_backend/coE_professor_controller.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || "DmeExplorer_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 3600000
    }
}));

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

        req.session.user = {
            id: result.user.id,
            username: result.user.username
        };

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

// Get the KKU professor information route via API
app.get("/api/kku-lecturers", KkuLecturerController.GetLecturers);

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

app.listen(5000, () => {
    console.log("Server started on port 5000");
});

