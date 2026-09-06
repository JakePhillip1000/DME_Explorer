import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css_styles/css_pages/login_page.css";
import CoEBackground from "../../assets/images/CoEBuilding2.png";
import GraduationCoEImage from "../../assets/images/Dme_graduate1.png";
import DMEStudio from "../../assets/images/Dme_239_studio1.png";

export function LoginCheck(){

    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loginMessage, setLoginMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();

        setUsernameError("");
        setPasswordError("");
        setLoginMessage("");

        try {
            setLoading(true);

            // send login information to backend
            const response = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({username, password})
            });

            // Get the result from login_controller.js
            const result = await response.json();

            if (!response.ok) {

                // WE need to validate the login information using login_validation.js from backend
                if (result.validation) {
                    setUsernameError(result.validation.username.message);
                    setPasswordError(result.validation.password.message);
                    return;
                }

                if (result.field === "username") {
                    setUsernameError(result.message);
                    return;
                }

                if (result.field === "password") {
                    setPasswordError(result.message);
                    return;
                }

                setLoginMessage(result.message || "Login failed.");
                return;
            }

            setLoginMessage(result.message);
            setUsername("");
            setPassword("");

            window.alert(result.message);

            navigate("/"); // navigate to homepage after login complete

        } 
        catch (error) {
            console.error(error);
            window.alert("Cannot connect to the server.");
        } 
        finally {
            setLoading(false);
        }
    };

    return (
        <form className="login-form" onSubmit={handleLogin}>
            <div className="login-input-group">
                <label className="login-input-label" htmlFor="username">Username</label>
                <input
                    className="login-input"
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => {
                        setUsername(event.target.value);
                        setUsernameError("");
                        setLoginMessage("");
                    }}
                />
                {usernameError && <p className="login-input-error">{usernameError}</p>}
            </div>
            <div className="login-input-group">
                <label className="login-input-label" htmlFor="password">Password:</label>
                <input
                    className="login-input"
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordError("");
                        setLoginMessage("");
                    }}
                />
                {passwordError && <p className="login-input-error">{passwordError}</p>}
            </div>
            
            <div className="login-options">
                <label className="remember-me">
                    <input className="remember-checkbox" type="checkbox" name="rememberMe"/>
                    <span className="remember-text">Remember me</span>
                </label>
                <Link className="forgot-password" to="/login">Forgot the password?</Link>
            </div>

            {loginMessage && <p className="login-success-message">{loginMessage}</p>}
            <div className="login-button-container">
                <button className="login-button" type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </div>
        </form>
    );
}

export function Login(){

    return (
        <main className="login-page">
            <section className="login-information">
                <div className="login-background" style={{ backgroundImage: `url(${CoEBackground})` }}></div>
                <div className="login-background-overlay"></div>
                
                <div className="login-information-content">
                    <p className="login-welcome">Welcome to the faculty of</p>
                    <h1 className="login-digitalmedia-engineering">Digital Media Engineering</h1>
                    <div className="login-images">
                        <img className="login-graduation-image" src={GraduationCoEImage} alt="CoE graduation students image"/>
                        <img className="login-studio-image" src={DMEStudio} alt="DME student at studio"/>
                    </div>

                    <p className="login-university">Khon Kaen university</p>
                    <p className="login-description">
                        Creating interesting digital experience by design, develop interactive digital media
                        <br className="login-desktop-break"/>
                        with optimizing technology systems
                    </p>
                    <p className="login-footer-text">
                        Come to join us and start the successful future career
                    </p>

                </div>
            </section>
            <section className="login-form-section">
                <div className="login-form-container">
                    <h2 className="login-title">Login</h2>

                    {/* The form for login */}
                    <LoginCheck />
                    <div className="login-register">
                        <span className="no-account-text">Don't have an account?</span>
                        <Link className="signup-link" to="/register">Sign up</Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

