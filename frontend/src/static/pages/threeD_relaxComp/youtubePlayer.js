let apiPromise;

export function LoadYouTubePlayer() {
    if (window.YT?.Player){
         return Promise.resolve(window.YT);
    }

    if (!apiPromise) {
        apiPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            const previousReady = window.onYouTubeIframeAPIReady;
            const timeout = window.setTimeout(() => reject(new Error("YouTube cannot load")), 15000);
            
            window.onYouTubeIframeAPIReady = () => {
                window.clearTimeout(timeout);
                previousReady?.();
                resolve(window.YT);
            };

            script.src = "https://www.youtube.com/iframe_api";
            script.onerror = () => {
                window.clearTimeout(timeout);
                script.remove();
                reject(new Error("Cannot load YouTube. Check your connection."));
            };

            document.head.appendChild(script);

        }).catch(error => {
            apiPromise = null;
            throw error;
        });
    }
    
    return apiPromise;
}
