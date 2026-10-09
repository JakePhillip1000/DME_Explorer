import {createElement, useEffect, useRef, useState} from "react";
import {LoadYouTubePlayer} from "./youtubePlayer.js";

// h creates HTML elements without JSX.
const h = createElement;

const API_URL = "/api/three-d/music";

// Send a request to the backend.
async function MusicRequest(method = "GET", body, signal) {
    const options = {
        method,
        credentials: "include",
        signal
    };

    if (body) {
        options.headers = {"Content-Type": "application/json"};
        options.body = JSON.stringify(body);
    }

    const response = await fetch(API_URL, options);

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("The music is unavailable");
    }

    if (!response.ok || !result.success) {
        throw new Error(result.message || "The music failed.");
    }

    return result;
}

export default function MusicConfiguration({open, onClose}) {
    // Song list and form.
    const [songs, SetSongs] = useState([]);
    const [title, SetTitle] = useState("");
    const [youtubeUrl, SetYouTubeUrl] = useState("");
    const [selectedSong, SetSelectedSong] = useState(null);

    // Request status.
    const [loading, SetLoading] = useState(false);
    const [saving, SetSaving] = useState(false);
    const [error, SetError] = useState("");
    const [message, SetMessage] = useState("");

    const [ready, SetReady] = useState(false);
    const [playbackError, SetPlaybackError] = useState("");

    const playerHost = useRef(null);
    const player = useRef(null);

    useEffect(() => {
        if (!selectedSong) return;

        let cancelled = false;
        let instance;

        async function CreatePlayer() {
            try {
                const YT = await LoadYouTubePlayer();

                if (cancelled) return;

                const element = document.createElement("div");
                playerHost.current.replaceChildren(element);

                instance = new YT.Player(element, {
                    videoId: selectedSong.video_id,

                    playerVars: {
                        playsinline: 1,
                        origin: window.location.origin
                    },

                    events: {
                        onReady: () => {
                            if (cancelled){
                                 return;
                            }

                            player.current = instance;
                            instance.setVolume(50);
                            SetReady(true);
                        },

                        onError: () => {
                            if (cancelled){
                                return;
                            } 

                            SetPlaybackError(
                                "YouTube cannot play this song. Select another song."
                            );
                        },

                        onAutoplayBlocked: () => {
                            if (cancelled){
                                 return;
                            }

                            SetPlaybackError("Brower block playback");
                        }
                    }
                });
            } 
            catch (error) {
                if (!cancelled) {
                    SetPlaybackError(error.message);
                }
            }
        }

        CreatePlayer();

        return () => {
            cancelled = true;
            player.current = null;
            instance?.destroy();
        };
    }, [selectedSong]);

    useEffect(() => {
        if (!open) return;

        const controller = new AbortController();

        async function GetSongs() {
            SetLoading(true);
            SetError("");
            SetMessage("");

            try {
                const result = await MusicRequest(
                    "GET",
                    undefined,
                    controller.signal
                );

                if (controller.signal.aborted) return;

                SetSongs(previous => {
                    const existingSongs = previous.filter(song => {
                        return !result.songs.some(item => {
                            return item.music_id === song.music_id;
                        });
                    });

                    return [...existingSongs, ...result.songs];
                });
            } 
            catch (error) {
                if (!controller.signal.aborted) {
                    SetError(error.message);
                }
            } 
            finally {
                if (!controller.signal.aborted) {
                    SetLoading(false);
                }
            }
        }

        GetSongs();

        return () => {
            controller.abort();
        };
    }, [open]);

    // Saving those submitted song to db --> passing to the backend side
    async function InsertSong(event) {
        event.preventDefault();

        if (saving) return;

        SetSaving(true);
        SetError("");
        SetMessage("");

        try {
            const result = await MusicRequest("POST", {
                title: title.trim(),
                youtube_url: youtubeUrl.trim()
            });

            SetSongs(previous => {
                const otherSongs = previous.filter(song => {
                    return song.music_id !== result.song.music_id;
                });

                return [result.song, ...otherSongs];
            });

            SetTitle("");
            SetYouTubeUrl("");
            SetMessage(result.message);
        } 
        catch (error) {
            SetError(error.message);
        } 
        finally {
            SetSaving(false);
        }
    }

    function SelectSong(song) {
        if (song !== selectedSong) {
            SetReady(false);
        }

        SetPlaybackError("");
        SetSelectedSong(song);
        onClose();
    }

    function StopMusic() {
        player.current?.stopVideo();
        player.current?.cueVideoById(selectedSong.video_id);
    }

    function PlayMusic() {
        SetPlaybackError("");
        player.current?.playVideo();
    }

    function PauseMusic() {
        player.current?.pauseVideo();
    }

    // This is the format for song submission
    function RenderForm() {
        return h("form", {
            className: "room-music-form",
            onSubmit: InsertSong
        },
            h("label", {
                className: "room-music-label",
                htmlFor: "room-music-title"
            }, "Song title"),

            h("input", {
                id: "room-music-title",
                className: "room-music-input",
                type: "text",
                value: title,
                maxLength: 100,
                required: true,
                placeholder: "Enter song title",
                onChange: event => SetTitle(event.target.value)
            }),

            h("label", {
                className: "room-music-label",
                htmlFor: "room-music-url"
            }, "YouTube URL"),

            h("input", {
                id: "room-music-url",
                className: "room-music-input",
                type: "url",
                value: youtubeUrl,
                maxLength: 2048,
                required: true,
                placeholder: "",
                onChange: event => SetYouTubeUrl(event.target.value)
            }),

            h("button", {
                className: "room-music-button",
                type: "submit",
                disabled: saving
            }, saving ? "Inserting..." : "Insert")
        );
    }

    // This contains the save song lists
    function RenderSongList() {
        return h("ul", {className: "room-music-list"},
            songs.map(song => {
                return h("li", {
                    className: "room-music-item",
                    key: song.music_id
                },
                    h("span", {
                        className: "room-music-song-title"
                    }, song.title),

                    h("button", {
                        className: "room-music-button",
                        type: "button",
                        onClick: () => SelectSong(song)
                    }, "Select")
                );
            })
        );
    }

    // This is the music menu
    function RenderMenu() {
        return h("section", {
            className: "room-music-panel",
            role: "dialog",
            "aria-label": "Room music"
        },
            h("div", {className: "room-music-header"},
                h("h2", {
                    className: "room-music-heading"
                }, "Room music"),

                h("button", {
                    className: "room-music-close",
                    type: "button",
                    onClick: onClose,
                    "aria-label": "Close music list"
                }, "x")
            ),

            RenderForm(),

            error && h("p", {
                className: "room-music-error",
                role: "alert"
            }, error),

            message && h("p", {
                className: "room-music-message",
                role: "status"
            }, message),

            h("h3", {
                className: "room-music-list-heading"
            }, "Song list"),

            loading && h("p", {
                className: "room-music-description"
            }, "Loading songs..."),

            !loading && songs.length === 0 && h("p", {
                className: "room-music-description"
            }, "No songs yet. Insert a YouTube URL above."),

            RenderSongList()
        );
    }

    function RenderControls() {
        return h("div", {
            className: "three-d-music-label room-music-controls"
        },
            h("span", null,
                `Selected music: ${selectedSong?.title || "No music"}`
            ),

            h("button", {
                type: "button",
                disabled: !ready,
                onClick: PlayMusic
            }, "Play"),

            h("button", {
                type: "button",
                disabled: !ready,
                onClick: PauseMusic
            }, "Pause"),

            h("button", {
                type: "button",
                disabled: !ready,
                onClick: StopMusic
            }, "Stop"),

            selectedSong && !ready && !playbackError && h("span", {
                role: "status"
            }, "Loading…"),

            playbackError && h("span", {
                role: "alert"
            }, playbackError)
        );
    }

    return h("div", {className: "room-music"},
        open && RenderMenu(),

        h("div", {
            ref: playerHost,
            hidden: true,
            "aria-hidden": true
        }),

        RenderControls()
    );
}

