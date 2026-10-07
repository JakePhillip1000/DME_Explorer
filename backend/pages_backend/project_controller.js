// Project controller.
import express from "express";
import multer from "multer";
import supabase from "../supabase_client.js";

const router = express.Router();
const TABLE = "student_projects";

const CATEGORIES = [
    "Game Development",
    "Digital Media",
    "Artificial Intelligence",
    "Software Development",
    "Competitions",
    "Others"
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const LIST_FIELDS = [
    "project_id",
    "project_title",
    "category",
    "published_date",
    "priority",
    "project_summary",
    "project_image"
].join(", ");

const DETAIL_FIELDS = `${LIST_FIELDS}, project_content`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function RequireAdmin(req, res, next) {
    if (req.session?.user?.username !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Only admin can modify this page"
        });
    }

    next();
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 8, fieldSize: 100 * 1024},

    fileFilter: (req, file, callback) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

        if (!allowedTypes.includes(file.mimetype)) {
            return callback(new Error("Choose a JPG, PNG, WebP or GIF image."));
        }

        callback(null, true);
    }
});

function ReceiveImage(req, res, next) {
    upload.single("project_image_file")(req, res, error => {
        if (!error) return next();

        const tooLarge = error.code === "LIMIT_FILE_SIZE";

        return res.status(tooLarge ? 413 : 400).json({
            success: false,
            message: tooLarge ? "Choose smaller image" : error.message
        });
    });
}

function ConvertImage(file) {
    const bytes = file.buffer;
    let type = "";

    if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
        type = "image/jpeg";
    }

    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    if (bytes.length >= 8 && bytes.subarray(0, 8).equals(pngSignature)) {
        type = "image/png";
    }

    const gifSignature = bytes.toString("ascii", 0, 6);

    if (["GIF87a", "GIF89a"].includes(gifSignature)) { 
        type = "image/gif";
    }

    if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
        type = "image/webp";
    }

    if (!type || type !== file.mimetype) {
        throw new Error("The image contents do not match its file type.");
    }

    return `data:${type};base64,${bytes.toString("base64")}`;
}

function ReadProject(body = {}) {
    const title = typeof body.project_title === "string" ? body.project_title.trim() : "";
    const content = typeof body.project_content === "string" ? body.project_content.trim() : "";
    const category = body.category;
    const date = body.published_date;
    const priority = Number(body.priority);

    if (!title || title.length > 160) {
        throw new Error("Enter a project title");
    }

    if (!content || content.length > 20000) {
        throw new Error("Project content cannot have more than 20000 char");
    }

    if (!CATEGORIES.includes(category)) {
        throw new Error("Choose a valid project category.");
    }

    if (![1, 2, 3].includes(priority)) {
        throw new Error("Choose Low, Medium or High priority.");
    }

    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("Choose a valid publish date.");
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
    ) {
        throw new Error("Need to choose valid publishing date");
    }

    return {
        project_title: title,
        category,
        published_date: date,
        priority,
        project_content: content,
        project_summary: content.replace(/\s+/g, " ").slice(0, 220)
    };
}

function DatabaseError(res, error) {
    console.error("Project database error:", error);

    return res.status(500).json({
        success: false,
        message: ""
    });
}

router.get("/categories", (req, res) => {
    res.json({
        success: true,
        categories: CATEGORIES
    });
});

router.get("/", async (req, res) => {
    try {
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
        const category = typeof req.query.category === "string" ? req.query.category : "";
        const page = Number(req.query.page || 1);

        if (search.length > 200 || (category && !CATEGORIES.includes(category)) || !Number.isInteger(page) || page < 1 || page > 10000) {
            return res.status(400).json({
                success: false,
                message: ""
            });
        }

        const pageSize = 12;

        let query = supabase
            .from(TABLE)
            .select(LIST_FIELDS, {count: "exact"});

        if (category) {
            query = query.eq("category", category);
        }

        if (search) {
            query = query.textSearch("search_document", search, {
                type: "plain",
                config: "english"
            });
        }

        const {data, error, count} = await query
            .order("priority", {ascending: false})
            .order("published_date", {ascending: false})
            .order("project_id", {ascending: false})
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) {
            return DatabaseError(res, error);
        }

        return res.json({
            success: true,
            projects: data || [],
            total: count || 0,
            page,
            pageSize
        });
    } 
    catch (error) {
        return DatabaseError(res, error);
    }
});

router.get("/:projectId", async (req, res) => {
    try {
        if (!UUID.test(req.params.projectId)) {
            return res.status(400).json({
                success: false,
                message: ""
            });
        }

        const {data, error} = await supabase
            .from(TABLE)
            .select(DETAIL_FIELDS)
            .eq("project_id", req.params.projectId)
            .maybeSingle();

        if (error) {
            return DatabaseError(res, error);
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: ""
            });
        }

        return res.json({
            success: true,
            project: data
        });
    } 
    catch (error) {
        return DatabaseError(res, error);
    }
});

router.post("/", RequireAdmin, ReceiveImage, async (req, res) => {
    let project;

    try {
        project = ReadProject(req.body);
        project.project_image = req.file ? ConvertImage(req.file) : null;
    } 
    catch (error) {
        return res.status(400).json({
            success: false,
            message: ""
        });
    }

    try {
        const {data, error} = await supabase
            .from(TABLE)
            .insert(project)
            .select("project_id")
            .single();

        if (error) {
            return DatabaseError(res, error);
        }

        return res.status(201).json({
            success: true,
            message: "",
            project: data
        });
    } 
    catch (error) {
        return DatabaseError(res, error);
    }
});

router.put("/:projectId", RequireAdmin, ReceiveImage, async (req, res) => {
    if (!UUID.test(req.params.projectId)) {
        return res.status(400).json({
            success: false,
            message: ""
        });
    }

    let project;

    try {
        project = ReadProject(req.body);

        if (req.file) {
            project.project_image = ConvertImage(req.file);
        } 
        else if (req.body.remove_image === "true") {
            project.project_image = null;
        }
    } 
    catch (error) {
        return res.status(400).json({
            success: false,
            message: ""
        });
    }

    try {
        const {data, error} = await supabase
            .from(TABLE)
            .update(project)
            .eq("project_id", req.params.projectId)
            .select("project_id")
            .maybeSingle();

        if (error) {
            return DatabaseError(res, error);
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: ""
            });
        }

        return res.json({
            success: true,
            message: "",
            project: data
        });
    } catch (error) {
        return DatabaseError(res, error);
    }
});

router.delete("/", RequireAdmin, async (req, res) => {
    const ids = req.body?.projectIds;

    if (
        !Array.isArray(ids) ||
        ids.length < 1 ||
        ids.length > 100 ||
        !ids.every(id => typeof id === "string" && UUID.test(id))
    ) {
        return res.status(400).json({
            success: false,
            message: ""
        });
    }

    try {
        const uniqueIds = [...new Set(ids)];

        const {data, error} = await supabase
            .from(TABLE)
            .delete()
            .in("project_id", uniqueIds)
            .select("project_id");

        if (error) {
            return DatabaseError(res, error);
        }

        const deletedIds = (data || []).map(project => project.project_id);

        return res.json({
            success: true,
            message: `${deletedIds.length} project(s) deleted.`,
            deletedIds
        });
    } catch (error) {
        return DatabaseError(res, error);
    }
});

export default router;