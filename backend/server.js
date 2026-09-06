const express = require("express");
const cors = require("cors");
const session = require("express-session");

const { RegisterUser } = require("./register_login_validation/register_controller.js");
const { LoginUser } = require("./register_login_validation/login_controller.js");

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

/*
This is where session secret comes from

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
*/

//console.log(process.env.SESSION_SECRET);
//console.log(app.use.session.secret);

// sending the HTTP post request to register page
app.post("/api/register", async (req, res) => {
    try {
        const {username, email, password, passwordConfirmation} = req.body;
        const result = await RegisterUser(username, email, password, passwordConfirmation);

        if (!result.success) {
            // here when register input field not put (not put some or all, this msg will show in log)
            // or result is invalid (not meet requirement), this can be shown
            return res.status(result.status || 400).json(result);
        }

        // When the registration is success
        return res.status(201).json(result);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const {username, password} = req.body;
        const result = await LoginUser(username, password);

        if (!result.success) {
            return res.status(result.status || 400).json(result);
        }

        req.session.user = {
            id: result.user.id,
            username: result.user.username
        };

        console.log("Login successful.");
        console.log("Session user:", req.session.user);

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

app.get("/api/session", (req, res) => {
    if (!req.session.user) {
        console.log("There is no session yet. NO user logged in");

        return res.status(401).json({
            loggedIn: false,
            message: "No user is logged in."
        });
    }

    console.log("User logged in");
    console.log("Session user: " + req.session.user);

    return res.status(200).json({
        loggedIn: true,
        user: req.session.user
    });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Unable to logout"
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

