import express from "express";
import multer from "multer";
import supabase from "../supabase_client.js";

import {GetAllNews, CreateNews, UpdateNews, IsAdmin, ConvertNewsImage} from "./news_modify.js";
const router = express.Router();

// ConvertNewsImage use Base64 conversion (image conversion)
const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024,
        fieldSize: 8 * 1024 * 1024
    },

    fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            return callback(
                new Error("Only image files are allowed.")
            );
        }

        callback(null, true);
    }
});

// Only admins can create or edit news.
function RequireNewsAdmin(req, res, next) {
    if (!IsAdmin(req)) {
        return res.status(403).json({
            success: false,
            message: "Only admin can modify news."
        });
    }

    next();
}

// Read the upload news image, is there an error occur? If yes, 
// then we need to handle the error occur in this
function ReceiveNewsImage(req, res, next) {
    upload.single("news_image_file")(req, res, (error) => {
        if (error) {
            let status = 400;
            let message = error.message;

            if (error.code === "LIMIT_FILE_SIZE") {
                status = 413;
                message = "Choose image of 5mb or smaller";
            } 
            else if (error.code === "LIMIT_FIELD_VALUE") {
                message = "Too large, use smaller image size or shorter text";
            }

            return res.status(status).json({
                success: false,
                message
            });
        }

        next();
    });
}

// GET /api/news and searching features
// GET /api/news
// Optional filters: keyword, category, from, before
router.get("/", async (req, res) => {
    try {
        const {
            keyword = "",
            category = "",
            from = "",
            before = ""
        } = req.query;

        if ([keyword, category, from, before].some(value => typeof value !== "string")) {
            return res.status(400).json({
                success: false,
                message: "Invalid search filtering",
                news: []
            });
        }

        const startTime = from ? Date.parse(from) : null;
        const endTime = before ? Date.parse(before) : null;

        if (
            (startTime !== null && !Number.isFinite(startTime)) ||
            (endTime !== null && !Number.isFinite(endTime))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date filter.",
                news: []
            });
        }

        if (
            startTime !== null &&
            endTime !== null &&
            startTime >= endTime
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date range.",
                news: []
            });
        }

        const result = await GetAllNews();

        if (!result.success) {
            return res.status(result.status || 500).json(result);
        }

        const keywordText = keyword.trim().toLowerCase();
        const categoryText = category.trim();

        const filteredNews = (result.news || []).filter(item => {

            const title = String(item.news_title || "").toLowerCase();
            const content = String(item.news_content || "").toLowerCase();

            if (
                keywordText &&
                !title.includes(keywordText) &&
                !content.includes(keywordText)
            ) {
                return false;
            }

            if (categoryText && item.category !== categoryText) {
                return false;
            }

            if (startTime !== null || endTime !== null) {
                const publishedTime = Date.parse(item.published_date);

                if (!Number.isFinite(publishedTime)) {
                    return false;
                }

                if (startTime !== null && publishedTime < startTime) {
                    return false;
                }

                if (endTime !== null && publishedTime >= endTime) {
                    return false;
                }
            }

            return true;
        });

        return res.status(200).json({
            success: true,
            news: filteredNews
        });
    } 
    catch (error) {
        console.error("Search news error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to search news.",
            news: []
        });
    }
});

// POST /api/news
// Actually when we want to create or edit the news (--> create the database)
router.post("/", RequireNewsAdmin, ReceiveNewsImage,
    async (req, res) => {
        try {
            let imageData = req.body.news_image || null;

            if (req.file) {
                const imageResult = ConvertNewsImage(req.file);

                if (!imageResult.success) {
                    return res
                        .status(imageResult.status || 400)
                        .json({
                            success: false,
                            message: imageResult.message
                        });
                }

                imageData = imageResult.imageUrl;
            }

            // Saving those news and enws information inside the supabase
            // call the CreateNews(req, newsData) from news_modify.js
            const result = await CreateNews(req, {
                news_title: req.body.news_title,
                category: req.body.category,
                published_date: req.body.published_date,
                news_image: imageData,
                priority: req.body.priority,
                news_content: req.body.news_content
            });

            return res.status(result.status || 201).json(result);
        } 
        catch (error) {
            console.error("Create news route error:", error);

            return res.status(500).json({
                success: false,
                message: error.message || "Unable to create news."
            });
        }
    }
);

// PUT /api/news/:newsId
router.put("/:newsId", RequireNewsAdmin, ReceiveNewsImage,
    async (req, res) => {
        try {
            let imageData = req.body.news_image;

            if (req.file) {
                const imageResult = ConvertNewsImage(req.file);

                if (!imageResult.success) {
                    return res.status(imageResult.status || 400).json({
                        success: false,
                        message: imageResult.message
                    });
                }

                imageData = imageResult.imageUrl;
            }

            const result = await UpdateNews(
                req,
                req.params.newsId,
                {
                    news_title: req.body.news_title,
                    category: req.body.category,
                    published_date: req.body.published_date,
                    news_image: imageData,
                    priority: req.body.priority,
                    news_content: req.body.news_content
                }
            );

            return res.status(result.status || 200).json(result);
        } 
        
        catch (error) {
            console.error("Update news route error:", error);

            return res.status(500).json({
                success: false,
                message: error.message || "Unable to update news."
            });
        }
    }
);

// deleting the news
router.delete("/", RequireNewsAdmin, async (req, res) => {
    try {
        const newsIds = req.body?.newsIds;

        if (!Array.isArray(newsIds) || newsIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select news to delete."
            });
        }

        // WE need to check the news ID before deleting it
        const validIds = newsIds.every(id => {
            if (typeof id === "number") {
                return Number.isSafeInteger(id) && id > 0;
            }

            if (typeof id !== "string" || !/^[1-9]\d{0,18}$/.test(id)) {
                return false;
            }

            return BigInt(id) <= 9223372036854775807n;
        });

        if (!validIds) {
            return res.status(400).json({
                success: false,
                message: "Invalid news selection."
            });
        }

        const uniqueIds = [...new Set(newsIds.map(id => String(id)))];

        // delete the news rows including the images
        const { data, error } = await supabase
            .from("engineer_news")
            .delete()
            .in("news_id", uniqueIds)
            .select("news_id");

        if (error) {
            console.error("Delete news database error:", error);

            return res.status(500).json({
                success: false,
                message: error.message || "Unable to delete news."
            });
        }

        const deletedIds = (data || []).map(item => item.news_id);

        if (deletedIds.length === 0) {
            return res.status(404).json({
                success: false,
                message: "NO news delete, refresh page and check the selection"
            });
        }

        return res.status(200).json({
            success: true,
            message: `${deletedIds.length} news item(s) deleted successfully.`,
            deletedIds
        });
    } 
    
    catch (error) {
        console.error("Delete news route error:", error);

        return res.status(500).json({
            success: false,
            message: "Cannot delete news"
        });
    }
});

export default router;
