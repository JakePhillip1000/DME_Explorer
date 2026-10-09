import {useEffect, useState} from "react";
import {NavigationBar} from "./components/navBar";
import OccupationBackground from "../../assets/images/Dme_239_studio1.png";
import LocationIcon from "../../assets/icons/location_icon.png";
import "../../static/css_styles/css_pages/occupation_page.css";

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "").replace(/\/$/, "");
const OCCUPATION_API = `${API_ORIGIN}/api/occupation`;

const INTERESTS = ["3D & Animation", "Game Dev", "AI & Data", "Software"];
const AVATAR_COLORS = 6;

// Lists already loaded in this visit, so switching back to a filter shows it at once
const loadedLists = {};

async function GetJobs(interest, refresh = false) {
    const query = new URLSearchParams({interest});

    if (refresh) {
        query.set("refresh", "1");
    }

    let response;
    try {
        response = await fetch(`${OCCUPATION_API}?${query}`);
    } catch {
        throw new Error("Cannot reach the occupation service. Check that the backend is running on port 5000.");
    }

    const result = await response.json().catch(() => {
        throw new Error("Cannot reach the occupation service. Check that the backend is running.");
    });

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Cannot load the job listings.");
    }

    loadedLists[interest] = result;
    return result;
}

/*
    The company tile shows the first letter of the first two words.
    The color comes from the company name and not the card position,
    so the same company keeps the same color when a filter moves the cards around.
*/
function CompanyTile(name) {
    const clean = (name || "").trim();

    // Take the first letter of each word, "Buono (Thailand)" should be "BT" and not "B("
    const initials = clean
        .split(/[\s\-—/]+/)
        .map(word => word.match(/[\p{L}\p{N}]/u)?.[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    let hash = 0;
    for (const character of clean) {
        hash = (hash * 31 + character.codePointAt(0)) >>> 0;
    }

    return {initials: initials || "?", color: hash % AVATAR_COLORS};
}

function TimeAgo(isoDate) {
    if (!isoDate) return "";

    const minutes = Math.round((Date.now() - new Date(isoDate).getTime()) / 60000);

    if (!Number.isFinite(minutes) || minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;

    return `${Math.round(hours / 24)} days ago`;
}

export function Occupation() {
    const [interest, SetInterest] = useState("");
    const [lists, SetLists] = useState({...loadedLists});
    const [refreshing, SetRefreshing] = useState(false);
    const [error, SetError] = useState({interest: "", message: ""});

    const data = lists[interest] || null;
    const errorMessage = error.interest === interest ? error.message : "";
    const loading = !data && !errorMessage;

    function SaveList(listInterest, result) {
        SetLists(previous => ({...previous, [listInterest]: result}));
        SetError({interest: "", message: ""});
    }

    // Always ask the backend again, a list loaded earlier is shown until the new one arrives
    useEffect(() => {
        let cancelled = false;

        GetJobs(interest)
            .then(result => {
                if (!cancelled) SaveList(interest, result);
            })
            .catch(error => {
                if (!cancelled) SetError({interest, message: error.message});
            });

        return () => {
            cancelled = true;
        };
    }, [interest]);

    async function RefreshJobs() {
        SetRefreshing(true);

        try {
            SaveList(interest, await GetJobs(interest, true));
        }
        catch (error) {
            SetError({interest, message: error.message});
        }
        finally {
            SetRefreshing(false);
        }
    }

    const jobs = data?.jobs || [];
    const updated = TimeAgo(data?.lastFetchedAt);

    return (
        <div className="occupation-page">
            <header className="occupation-navigation">
                <NavigationBar/>
            </header>

            <main className="occupation-main">
                <section className="occupation-banner" style={{"--occupation-background-image": `url(${OccupationBackground})`}}>
                    <h1 className="occupation-heading">Occupation</h1>
                    <p className="occupation-heading-description">Job listings open now for DME graduates, choose the area you are interested in</p>
                </section>

                <section className="occupation-body" aria-label="Job listings">
                    <div className="occupation-toolbar">
                        <div className="occupation-filters" role="group" aria-label="Filter by interest">
                            {["", ...INTERESTS].map(item => (
                                <button
                                    className="occupation-filter-button"
                                    key={item || "all"}
                                    type="button"
                                    aria-pressed={interest === item}
                                    onClick={() => SetInterest(item)}
                                >
                                    {item || "All"}
                                </button>
                            ))}
                        </div>

                        <button className="occupation-refresh-button" type="button" disabled={loading || refreshing} onClick={RefreshJobs}>
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {!loading && data && (
                        <p className="occupation-status-line" role="status">
                            {data.sample ? "" : `${jobs.length} listing${jobs.length === 1 ? "" : "s"}${updated ? ` · updated ${updated}` : ""}`}
                            {!data.sample && data.note ? " · " : ""}
                            {data.note}
                        </p>
                    )}

                    {errorMessage && <p className="occupation-error" role="alert">{errorMessage}</p>}

                    {loading ? (
                        <p className="occupation-loading" role="status">Loading job listings...</p>
                    ) : (
                        <div className="occupation-grid">
                            {jobs.map(job => {
                                const tile = CompanyTile(job.company);

                                return (
                                    <a className="occupation-card" key={job.id} href={job.url} target="_blank" rel="noreferrer">
                                        <span className={`occupation-company-tile occupation-tile-color-${tile.color}`} aria-hidden="true">
                                            {tile.initials}
                                        </span>

                                        <div className="occupation-card-body">
                                            {job.interest && <p className="occupation-card-interest">{job.interest}</p>}
                                            <h2 className="occupation-card-title">{job.title}</h2>
                                            <p className="occupation-card-company">{job.company}</p>

                                            <p className="occupation-card-location">
                                                <img className="occupation-location-icon" src={LocationIcon} alt=""/>
                                                {job.location}
                                            </p>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    {!loading && !errorMessage && !jobs.length && (
                        <p className="occupation-empty">No job listings for this interest yet.</p>
                    )}
                </section>
            </main>
        </div>
    );
}
