const supabase = require("./supabase_client.js");

const ADMIN_USERNAME = "admin";

function IsAdmin(req) {
    return req.session && req.session.user && req.session.user.username === ADMIN_USERNAME;
}

async function GetAllNews() {
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
}

async function CreateNews(req, newsData) {
    if (!IsAdmin(req)) {
        return {
            success: false,
            status: 403,
            message: "Only admin can create news."
        };
    }

    const {
        news_title,
        category,
        published_date,
        news_image,
        priority,
        news_content
    } = newsData;

    if (!news_title || !category || !news_content) {
        return {
            success: false,
            status: 400,
            message: "News title, category and news content are required."
        };
    }

    const { data, error } = await supabase
        .from("engineer_news")
        .insert([
            {
                news_title: news_title,
                category: category,
                published_date: published_date || new Date().toISOString(),
                news_image: news_image || null,
                priority: Number(priority) || 1,
                news_content: news_content
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
}

async function UpdateNews(req, newsId, newsData) {
    if (!IsAdmin(req)) {
        return {
            success: false,
            status: 403,
            message: "Only admin can edit news."
        };
    }

    const {
        news_title,
        category,
        published_date,
        news_image,
        priority,
        news_content
    } = newsData;

    if (!news_title || !category || !news_content) {
        return {
            success: false,
            status: 400,
            message: "News title, category and news content are required."
        };
    }

    const { data, error } = await supabase
        .from("engineer_news")
        .update({
            news_title: news_title,
            category: category,
            published_date: published_date,
            news_image: news_image || null,
            priority: Number(priority) || 1,
            news_content: news_content
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
}

module.exports = {
    IsAdmin,
    GetAllNews,
    CreateNews,
    UpdateNews
};

