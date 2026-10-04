// This page use for sending chat and music data...
// Creating 2 tables of supabase

import express from "express";
import supabase from "../supabase_client.js";

const router = express.Router();
const MUSIC_TABLE = "room_music";

function CleanText(value) {
    return typeof value === "string" ? value.trim() : "";
}

const GetYouTubeVideoId = (value) => {
    try {
        const url = new URL(value);

        if (!["https:", "http:"].includes(url.protocol)) {
            return null;
        }

        let videoId = null;
        const parts = url.pathname.split("/").filter(Boolean);

        if (url.hostname === "youtu.be") {
            videoId = parts[0];
        } 
        
        else if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(url.hostname)) {
            if (url.pathname === "/watch") {
                videoId = url.searchParams.get("v");
            } 
            
            else if (["shorts", "embed", "live"].includes(parts[0])) {
                videoId = parts[1];
            }
        }

        return /^[A-Za-z0-9_-]{11}$/.test(videoId || "") ? videoId : null;
    } 
    catch {
        return null;
    }
}

// GET /api/three-d/music, also retrieve the shared song list
router.get("/music", async (req, res) => {
    try {
        const {data, error} = await supabase
            .from(MUSIC_TABLE)
            .select("music_id, title, youtube_url, video_id, created_at")
            .order("created_at", {ascending: false});

        if (error) {
            console.error(`room mysic error GET: ${error.message}`);

            return res.status(500).json({
                success: false,
                message: "Cannot retrieve the song list.",
                songs: []
            });
        }

        return res.status(200).json({
            success: true,
            songs: data || []
        });
    } 
    catch (error) {
        console.error(`Music routing error: ${error.message}`);

        return res.status(500).json({
            success: false,
            message: "Cannot retrieve those musics",
            songs: []
        });
    }
});

// POST /api/three-d/music, also save the song submitted by logged in users
router.post("/music", async (req, res) => {
    try {
        const user = req.session?.user;

        if (user?.id === undefined || user?.id === null) {
            return res.status(401).json({
                success: false,
                message: "Login before inserting a song"
            });
        }

        const title = CleanText(req.body?.title);
        const youtubeUrl = CleanText(req.body?.youtube_url);

        if (!title || !youtubeUrl) {
            return res.status(400).json({
                success: false,
                message: "Enter the song title and YouTube URL."
            });
        }

        if (title.length > 100 || youtubeUrl.length > 2048) {
            return res.status(400).json({
                success: false,
                message: "The song title or URL is too long"
            });
        }

        const videoId = GetYouTubeVideoId(youtubeUrl);

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid YouTube video link (watch, share, Shorts or live)."
            });
        }

        const {data, error} = await supabase
            .from(MUSIC_TABLE)
            .insert({
                title,
                youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
                video_id: videoId,
                submitted_by: String(user.id)
            })
            .select("music_id, title, youtube_url, video_id, created_at")
            .single();

        if (error) {
            if (error.code === "23505") {
                return res.status(409).json({
                    success: false,
                    message: "This YouTube video is already in the song list."
                });
            }

            console.error(`Inserting music error: ${error.message}`);

            return res.status(500).json({
                success: false,
                message: "Cannot save the song. Please try again."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Inserting song successfully",
            song: data
        });
    } 
    catch (error) {
        console.error(`Inserting music routing error: ${error.message}`);

        return res.status(500).json({
            success: false,
            message: "Unable to insert the song from YouTube"
        });
    }
});

export default router;

