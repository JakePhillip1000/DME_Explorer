import express from "express";
import supabase from "../supabase_client.js";

const router = express.Router();
const CONTACT_TABLE = "contact_forms";

function CleanText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function IsValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function IsValidFormId(formId) {
    return /^[1-9]\d*$/.test(String(formId));
}

function RequireLoggedInUser(req, res, next) {
    if (!req.session?.user?.id) {
        return res.status(401).json({
            success: false,
            message:
                "Please log in before submitting or viewing contact forms."
        });
    }

    next();
}

router.post(
    "/",
    RequireLoggedInUser,
    async (req, res) => {
        try {
            const userId = req.session.user.id;
            const firstName = CleanText(req.body.firstName);
            const lastName = CleanText(req.body.lastName);
            const email = CleanText(req.body.email).toLowerCase();
            const topics = CleanText(req.body.topics);
            const messageAbout = CleanText(req.body.message_about);

            if (!firstName || !lastName || !email || !topics ||!messageAbout) {
                return res.status(400).json({
                    success: false,
                    message: "Should input every field in contact"
                });
            }

            if (!IsValidEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email."
                });
            }

            if (
                firstName.length > 20 ||
                lastName.length > 20 ||
                email.length > 100 ||
                topics.length > 100 ||
                messageAbout.length > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Some information is too long."
                });
            }

            const { data, error } = await supabase
                .from(CONTACT_TABLE)
                .insert([
                    {
                        user_id: userId,
                        firstName,
                        lastName,
                        email,
                        topics,
                        message_about: messageAbout,
                        admin_response: null,
                        response_status: "pending",
                        response_read: false,
                        responded_at: null
                    }
                ])
                .select("*, form_id:forms_id")
                .single();

            if (error) {
                console.error(
                    "Contact insertion error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Cannot save the contact form."
                });
            }

            return res.status(201).json({
                success: true,
                message: "",
                contact: data
            });
        } 
        
        catch (error) {
            console.error(
                "Contact submission error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error."
            });
        }
    }
);

router.get(
    "/responses/unread-count",
    RequireLoggedInUser,
    async (req, res) => {
        try {
            const userId = req.session.user.id;

            const { count, error } = await supabase
                .from(CONTACT_TABLE)
                .select("form_id:forms_id", {
                    count: "exact",
                    head: true
                })
                .eq("user_id", userId)
                .eq("response_status", "answered")
                .eq("response_read", false);

            if (error) {
                console.error("Unread response count error:", error);
                return res.status(500).json({
                    success: false,
                    count: 0,
                    message: "Cannot retrieve notification count."
                });
            }

            return res.status(200).json({
                success: true,
                count: count || 0
            });
        } catch (error) {
            console.error(
                "Unread response count error:",
                error
            );

            return res.status(500).json({
                success: false,
                count: 0,
                message: "Internal server error."
            });
        }
    }
);


router.get(
    "/responses",
    RequireLoggedInUser,
    async (req, res) => {
        try {
            const userId = req.session.user.id;

            const { data, error } = await supabase
                .from(CONTACT_TABLE)
                .select(
                    `
                    form_id:forms_id,
                    topics,
                    message_about,
                    admin_response,
                    response_status,
                    response_read,
                    created_at,
                    responded_at
                    `
                )
                .eq("user_id", userId)
                .eq("response_status", "answered")
                .not("admin_response", "is", null)
                .order("responded_at", {
                    ascending: false
                });

            if (error) {
                console.error(
                    "Get user responses error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Cannot retrieve your responses.",
                    responses: []
                });
            }

            return res.status(200).json({
                success: true,
                responses: data || []
            });
        } catch (error) {
            console.error(
                "Get user responses error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error.",
                responses: []
            });
        }
    }
);

router.patch(
    "/responses/:formId/read",
    RequireLoggedInUser,
    async (req, res) => {
        try {
            const userId = req.session.user.id;
            const formId = req.params.formId;

            if (!IsValidFormId(formId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid form ID."
                });
            }

            const { data, error } = await supabase
                .from(CONTACT_TABLE)
                .update({
                    response_read: true
                })
                .eq("forms_id", formId)
                .eq("user_id", userId)
                .eq("response_status", "answered")
                .select("form_id:forms_id")
                .maybeSingle();

            if (error) {
                console.error(
                    "Mark response as read error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Cannot mark the response as read."
                });
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message:
                        "The response was not found."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Response marked as read."
            });
        } catch (error) {
            console.error(
                "Mark response as read error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error."
            });
        }
    }
);

export default router;
