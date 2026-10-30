const TOKEN_KEY = "dme-tab-session";

export function GetSessionToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
}

export async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers);
    const token = GetSessionToken();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(url, {...options, headers, credentials: "omit"});
    const pathname = new URL(url, window.location.origin).pathname;
    
    if (response.ok && pathname === "/api/login") {
        const result = await response.clone().json();
        if (result.sessionToken) {
            sessionStorage.setItem(TOKEN_KEY, result.sessionToken);
        }
    }

    if (response.ok && pathname === "/api/logout"){
         sessionStorage.removeItem(TOKEN_KEY);
    }
    
    return response;
}
