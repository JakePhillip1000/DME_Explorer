import express from "express";
import supabase from "../supabase_client.js";

const router = express.Router();

const ADMIN_USERNAME = "admin";
const CONTACT_TABLE = "contact_forms";

function CleanText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function IsValidFormId(formId) {
    return /^[1-9]\d*$/.test(String(formId));
}

function RequireAdmin(req, res, next) {
    if (req.session?.user?.username !== ADMIN_USERNAME) {
        return res.status(403).json({
            success: false,
            message: "Only admin can manage contact forms."
        });
    }

    next();
}

router.get(
    "/",
    RequireAdmin,
    async (req, res) => {
        try {
            const { data, error } = await supabase
                .from(CONTACT_TABLE)
                .select(
                    `
                    form_id:forms_id,
                    user_id,
                    firstName,
                    lastName,
                    email,
                    topics,
                    message_about,
                    admin_response,
                    response_status,
                    response_read,
                    created_at,
                    responded_at
                    `
                )
                .order("created_at", {
                    ascending: false
                });

            if (error) {
                console.error(
                    "Get admin contacts error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Cannot retrieve contact forms.",
                    contacts: []
                });
            }

            return res.status(200).json({
                success: true,
                contacts: data || []
            });
        } catch (error) {
            console.error(
                "Get admin contacts error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error.",
                contacts: []
            });
        }
    }
);

router.patch(
    "/:formId/reply",
    RequireAdmin,
    async (req, res) => {
        try {
            const formId = req.params.formId;

            const adminResponse = CleanText(
                req.body.response
            );

            if (!IsValidFormId(formId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid form ID."
                });
            }

            if (!adminResponse) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a response."
                });
            }

            if (adminResponse.length > 5000) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Response cannot exceed 5000 characters."
                });
            }

            const { data: existingForm, error: findError } =
                await supabase
                    .from(CONTACT_TABLE)
                    .select(
                        "form_id:forms_id, user_id, response_status"
                    )
                    .eq("forms_id", formId)
                    .single();

            if (findError || !existingForm) {
                return res.status(404).json({
                    success: false,
                    message:
                        "The contact form was not found."
                });
            }

            if (!existingForm.user_id) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This form is not connected to a user account."
                });
            }

            const { data, error } = await supabase
                .from(CONTACT_TABLE)
                .update({
                    admin_response: adminResponse,
                    response_status: "answered",
                    response_read: false,
                    responded_at:
                        new Date().toISOString()
                })
                .eq("forms_id", formId)
                .select("*, form_id:forms_id")
                .single();

            if (error) {
                console.error(
                    "Save admin response error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Cannot save the admin response."
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Response saved. The user now has a new notification.",
                contact: data
            });
        } catch (error) {
            console.error(
                "Admin response error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error."
            });
        }
    }
);

router.delete(
    "/",
    RequireAdmin,
    async (req, res) => {
        try {
            const formIds = req.body?.formIds;

            if (
                !Array.isArray(formIds) ||
                formIds.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Select at least one form to delete."
                });
            }

            const validIds = formIds.every(
                IsValidFormId
            );

            if (!validIds) {
                return res.status(400).json({
                    success: false,
                    message:
                        "One or more form IDs are invalid."
                });
            }

            const uniqueIds = [
                ...new Set(
                    formIds.map(formId =>
                        String(formId)
                    )
                )
            ];

            const { data, error } = await supabase
                .from(CONTACT_TABLE)
                .delete()
                .in("forms_id", uniqueIds)
                .select("form_id:forms_id");

            if (error) {
                console.error(
                    "Delete contact forms error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Cannot delete the selected forms."
                });
            }

            const deletedIds = (data || []).map(
                form => form.form_id
            );

            return res.status(200).json({
                success: true,
                message:
                    `${deletedIds.length} form(s) deleted.`,
                deletedIds
            });
        } catch (error) {
            console.error(
                "Delete contact forms error:",
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

