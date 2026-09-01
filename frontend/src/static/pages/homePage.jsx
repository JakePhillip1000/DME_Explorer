import { useEffect, useState } from "react";
import "../css_styles/css_pages/homePage_style.css";

function Home() {
    const [backendData, setBackendData] = useState({ users: [] });

    useEffect(() => {
        fetch("/api")
            .then((response) => response.json())
            .then((data) => {
                setBackendData(data);
            })
            .catch((error) => {
                console.error("Error fetching backend data:", error);
            });
    }, []);

    return (
        <div>
            <h1>Welcome to DME Explorer</h1>

            <p>These are some information</p>

            {backendData.users.length === 0 ? (
                <p>Loading...</p>
            ) : (
                backendData.users.map((user, i) => (
                    <p key={i}>{user}</p>
                ))
            )}
        </div>
    );
}

export default Home;

