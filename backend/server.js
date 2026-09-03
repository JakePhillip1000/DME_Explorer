const express = require("express");
const cors = require("cors");
const { RegisterUser } = require("../backend/register_login_validation/register_controller.js"); // the regsister controller file

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/register", async (req, res) => {
    try {
        const {username, email, password, passwordConfirmation} = req.body;
        const result = await RegisterUser(username, email, password, passwordConfirmation);

        if (!result.success) {
            // here when register input field not put (not put some or all, this msg will show in log)
            // or result is invalid (not meet requirement), this can be shown
            return res.status(result.status || 400).json(result);
        }

        return res.status(201).json(result);
    } 
    
    catch (error) {
        console.error(error);

        return res.status(500).json({success: false, message: "Internal server error."});
    }
});

app.listen(5000, () => {
    console.log("Server started on port 5000");
});
