import express from "express";
import supabase from "../supabase_client.js";

const router = express.Router();
const CONTACT_TABLE = "contact_forms";

const CleanText = (value) => {
        return typeof value === "string" ? value.trim() : "";
}

const IsValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/", async (req, res) => {
    try {
        const firstName = CleanText(req.body.firstName);
        const lastName = CleanText(req.body.lastName);
        const email = CleanText(req.body.email).toLowerCase();
        const topics = CleanText(req.body.topics);
        const messageAbout = CleanText(req.body.message_about)

        if (!firstName || !lastName || !email || !topics || !messageAbout) {
            return res.status(400).json({success: false, message: "Complete the contact form of all fields"});
        }

        if (!IsValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }

        if (firstName.length > 20 || lastName.length > 20 || email.length > 30 || topics.length > 100 || messageAbout.length > 1000) {
            return res.status(400).json({success: false, message: "Some information filled is too long"});
        }

        const { data, error } = await supabase.from(CONTACT_TABLE).insert([
            {
                firstName, lastName, email, topics, message_about: messageAbout
            }
        ]).select().single();

        if (error) {
            console.error(`Supabase contact form insertion error: ${error}`);
            return res.status(500).json({
                success: false,
                message: "Cannot save the contact form"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Form submit successfully",
            contact: data
        });
    }

    catch(error) {
        console.error(`Contact router error: ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal error"
        })
    }
})

export default router;
