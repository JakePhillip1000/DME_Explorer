import supabase from "../supabase_client.js";
const ADMIN_USERNAME = "admin";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function IsAdmin(req) {
    return Boolean(
        req.session &&
        req.session.user &&
        req.session.user.username === ADMIN_USERNAME
    );
}

function ConvertNewsImage(file) {
    if (!file) {
        return { success: true, imageUrl: null };
    }

    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
        return { success: false, status: 400, message: "Only image files are allowed." };
    }

    if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
        return { success: false, status: 400, message: "The image file is empty or invalid." };
    }

    if (file.buffer.length > MAX_IMAGE_SIZE) {
        return { success: false, status: 413, message: "Please choose an image of 5 MB or smaller." };
    }

    return {
        success: true,
        imageUrl: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
    };
}

async function GetAllNews() {
    try {
        const { data, error } = await supabase
            .from("engineer_news")
            .select("*")
            .order("priority", { ascending: false })
            .order("published_date", { ascending: false });

        if (error) {
            console.error("Get news error:", error);

            return {
                success: false,
                status: 500,
                message: error.message,
                news: []
            };
        }

        return {
            success: true,
            status: 200,
            news: data || []
        };
    } catch (error) {
        console.error("GetAllNews error:", error);

        return {
            success: false,
            status: 500,
            message: error.message || "Unable to get news.",
            news: []
        };
    }
}

async function CreateNews(req, newsData) {
    if (!IsAdmin(req)) {
        return {
            success: false,
            status: 403,
            message: "Only admin can create news."
        };
    }

    const { news_title, category, published_date, news_image, priority, news_content} = newsData;

    if (!news_title || !category || !news_content) {
        return {
            success: false,
            status: 400,
            message: "News title, category and news content are required."
        };
    }

    try {
        const { data, error } = await supabase
            .from("engineer_news")
            .insert([
                {
                    news_title,
                    category,
                    published_date:
                        published_date || new Date().toISOString(),
                    news_image: news_image || null,
                    priority: Number(priority) || 1,
                    news_content
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Create news error:", error);

            return {
                success: false,
                status: 500,
                message: error.message
            };
        }

        return {
            success: true,
            status: 201,
            message: "News created successfully.",
            news: data
        };
    } catch (error) {
        console.error("CreateNews error:", error);

        return {
            success: false,
            status: 500,
            message: error.message || "Unable to create news."
        };
    }
}

async function UpdateNews(req, newsId, newsData) {
    if (!IsAdmin(req)) {
        return {
            success: false,
            status: 403,
            message: "Only admin can edit news."
        };
    }

    const { news_title, category, published_date, news_image, priority, news_content } = newsData;

    if (!news_title || !category || !news_content) {
        return {
            success: false,
            status: 400,
            message: "News title, category and news content are required."
        };
    }

    try {
        const { data, error } = await supabase
            .from("engineer_news")
            .update({
                news_title,
                category,
                published_date:
                    published_date || new Date().toISOString(),
                ...(news_image !== undefined ? { news_image: news_image || null } : {}),
                priority: Number(priority) || 1,
                news_content
            })
            .eq("news_id", newsId)
            .select()
            .single();

        if (error) {
            console.error("Update news error:", error);

            return {
                success: false,
                status: 500,
                message: error.message
            };
        }

        return {
            success: true,
            status: 200,
            message: "News updated successfully.",
            news: data
        };
    } catch (error) {
        console.error("UpdateNews error:", error);

        return {
            success: false,
            status: 500,
            message: error.message || "Unable to update news."
        };
    }
}

export { IsAdmin, ConvertNewsImage, GetAllNews, CreateNews, UpdateNews };

