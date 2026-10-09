// Occupation controller --> job listings for DME graduates from the JSearch API (RapidAPI)
//
// The free JSearch plan only allows 200 calls a month and returns about 10 jobs per call,
// so the listings are saved and reused instead of calling the API on every page visit.
// The saved state is written to a file in the system temp folder, so restarting the
// server (nodemon restarts on every save) does not forget it and spend the quota again.
// It is not kept inside backend/ because nodemon would restart when the file changes.
import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { SAMPLE_JOBS } from "./occupation_sample_jobs.js";

const router = express.Router();

// Each interest is searched with its own words. Only these values are accepted,
// because every new value would be its own cache and spend its own API call.
const INTEREST_SEARCH = {
    "3D & Animation": "3D animation artist",
    "Game Dev": "game developer",
    "AI & Data": "AI data science",
    "Software": "software developer"
};

const CACHE_TIME = 24 * 60 * 60 * 1000;      // a saved list is used for 24 hours
const MIN_LIVE_GAP = 10 * 60 * 1000;         // at least 10 minutes between live calls, even on refresh
const MONTHLY_LIVE_LIMIT = 170;              // under the plan's 200, in case of a miscount
const MAX_JOBS = 60;
const CACHE_FILE = path.join(os.tmpdir(), "dme_explorer_occupation_cache.json");

// 5 lists (All + 4 interests) x 1 call a day = 150 calls a month, which fits the limit.
// If CACHE_TIME, MONTHLY_LIVE_LIMIT or the number of interests changes, redo this sum.

function ReadCacheFile() {
    try {
        return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    }
    catch {
        return { lists: {}, budget: { month: "", calls: 0 } };
    }
}

const cache = ReadCacheFile();

function SaveCacheFile() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
    }
    catch (error) {
        console.error("Occupation cache save error:", error.message);
    }
}

// The month's calls are spread over the days, so pressing refresh many times
// can only spend today's share and not empty the whole month in a few hours.
function TodayLimit(now = new Date()) {
    const day = now.getUTCDate();
    const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();

    return Math.min(MONTHLY_LIVE_LIMIT, Math.ceil(MONTHLY_LIVE_LIMIT * day / daysInMonth) + 5);
}

function UseBudget() {
    const month = new Date().toISOString().slice(0, 7);

    if (cache.budget.month !== month) {
        cache.budget = { month, calls: 0 };
    }

    if (cache.budget.calls >= TodayLimit()) {
        return false;
    }

    cache.budget.calls++;
    return true;
}

// The same job comes back under different ids from different job boards,
// so the title and the company are what make a job unique.
function RemoveDuplicates(jobs) {
    const seen = new Set();

    return jobs.filter(job => {
        const key = `${job.title.trim().toLowerCase()}|${job.company.trim().toLowerCase()}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function SampleJobs(interest) {
    const jobs = interest ? SAMPLE_JOBS.filter(job => job.interest === interest) : [...SAMPLE_JOBS];

    // Shuffle so the sample list does not always look the same
    for (let i = jobs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
    }

    return jobs;
}

async function GetLiveJobs(interest, apiKey) {
    const search = `${INTEREST_SEARCH[interest] || "digital media"} jobs Thailand`;
    const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(search)}&num_pages=1&country=th&date_posted=all`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "x-rapidapi-key": apiKey,
                "x-rapidapi-host": "jsearch.p.rapidapi.com"
            }
        });

        if (!response.ok) {
            // Keep part of the reply, a 429 (quota used up) and a 403 (wrong key) need different fixes
            const detail = await response.text().catch(() => "");
            throw new Error(`JSearch API ${response.status} ${detail.slice(0, 160)}`);
        }

        const result = await response.json();

        return (result.data?.jobs || []).map(job => ({
            id: job.job_id,
            title: job.job_title || "",
            company: job.employer_name || "",
            location: job.job_city
                ? `${job.job_city}, ${job.job_country}`
                : (job.job_location || "").split("•")[0].trim() || job.job_country || "Thailand",
            interest,
            postedAt: job.job_posted_at_datetime_utc || null,
            url: job.job_apply_link
        }));
    }
    finally {
        clearTimeout(timeout);
    }
}

router.get("/", async (req, res) => {
    const interest = typeof req.query.interest === "string" ? req.query.interest : "";
    const refresh = req.query.refresh === "1";

    if (interest && !Object.hasOwn(INTEREST_SEARCH, interest)) {
        return res.status(400).json({
            success: false,
            message: "Unknown interest"
        });
    }

    const apiKey = process.env.JSEARCH_API_KEY?.trim();
    const key = interest || "all";
    const saved = cache.lists[key] || { jobs: [], lastFetch: 0 };
    const sinceLastFetch = Date.now() - saved.lastFetch;

    const shouldGoLive = Boolean(apiKey) && sinceLastFetch >= MIN_LIVE_GAP &&
        (saved.jobs.length === 0 || refresh || sinceLastFetch >= CACHE_TIME);

    let budgetReached = false;
    let liveFailed = false;

    if (shouldGoLive) {
        if (UseBudget()) {
            // Save the time before calling, so a failing API also waits 10 minutes before the next try
            saved.lastFetch = Date.now();
            cache.lists[key] = saved;

            try {
                const liveJobs = await GetLiveJobs(interest, apiKey);
                const liveIds = new Set(liveJobs.map(job => job.id));

                // Add the new jobs on top of the saved ones, so the list grows with every call
                saved.jobs = RemoveDuplicates([...liveJobs, ...saved.jobs.filter(job => !liveIds.has(job.id))]).slice(0, MAX_JOBS);
            }
            catch (error) {
                liveFailed = true;
                console.error("Occupation live fetch error:", error.message);
            }

            SaveCacheFile();
        }
        else {
            budgetReached = true;
        }
    }

    if (saved.jobs.length) {
        let note = "";

        if (budgetReached) {
            note = "Live job budget reached, showing saved listings until tomorrow.";
        }
        else if (liveFailed) {
            note = "Live job data is not available right now, showing saved listings.";
        }
        else if (refresh && !shouldGoLive) {
            note = "Refreshed recently, showing the saved listings to save the API quota.";
        }

        return res.status(200).json({
            success: true,
            jobs: saved.jobs,
            sample: false,
            lastFetchedAt: new Date(saved.lastFetch).toISOString(),
            note
        });
    }

    let note = "Showing example listings. Set JSEARCH_API_KEY in backend/.env for live job data.";

    if (budgetReached) {
        note = "Live job budget reached, showing example listings until tomorrow.";
    }
    else if (apiKey) {
        note = "Live job data is not available right now, showing example listings.";
    }

    return res.status(200).json({
        success: true,
        jobs: SampleJobs(interest),
        sample: true,
        lastFetchedAt: null,
        note
    });
});

export default router;
