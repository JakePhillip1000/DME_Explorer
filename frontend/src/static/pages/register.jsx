import { useState } from 'react';
import { Link, Navigate, useNavigate } from "react-router-dom";
import "../css_styles/css_pages/registerPage_style.css";
import CoEBackground from "../../assets/images/CoEBuilding2.png";
import GraduationCoEImage from "../../assets/images/Dme_graduate1.png";
import DMEStudio from "../../assets/images/Dme_239_studio1.png";

export function RegisterSignup(){
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordConfirmationError, setPasswordConfirmationError] = useState("");
    const [registerMessage, setRegisterMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (event) => {
        event.preventDefault();

        setUsernameError("");
        setEmailError("");
        setPasswordError("");
        setPasswordConfirmationError("");
        setRegisterMessage("");

        try {
            setLoading(true);
            
            // get the response fromt the server
            const response = await fetch("http://localhost:5000/api/register", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, email, password, passwordConfirmation})
            });

            const result = await response.json();
            //console.log(result);

            if (!response.ok) {
                if (result.validation) {
                    setUsernameError(result.validation.username.message);
                    setEmailError(result.validation.email.message);
                    setPasswordError(result.validation.password.message);
                    setPasswordConfirmationError(result.validation.passwordConfirmation.message);
                    return;
                }

                if (result.field === "username") {
                    setUsernameError(result.message);
                    return;
                }

                if (result.field === "email") {
                    setEmailError(result.message);
                    return;
                }

                if (result.field === "passwordConfirmation") {
                    setPasswordConfirmationError(result.message);
                    return;
                }

                window.alert(result.message || "Registration failed.");
                return;
            }

            setRegisterMessage(result.message);
            setUsername("");
            setEmail("");
            setPassword("");
            setPasswordConfirmation("");
            navigate("/login")

            window.alert("Registration Complete");

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
        <form onSubmit={handleRegister}>
            <div className="register-input-group">
                <label htmlFor="username">Username: </label>
                <input id="username" name="username" type="text" placeholder="Enter your username:" autoComplete="on" value={username} onChange={(event) => { setUsername(event.target.value); setUsernameError(""); }} />
                {usernameError && <p className="register-input-error">{usernameError}</p>}
            </div>

            <div className="register-input-group">
                <label htmlFor="email">Email Address: </label>
                <input id="email" name="email" type="email" placeholder="Enter your email address:" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(""); }} />
                {emailError && <p className="register-input-error">{emailError}</p>}
            </div>

            <div className="register-input-group">
                <label htmlFor="password">Password: </label>
                <input id="password" name="password" type="password" placeholder="Enter your password:" autoComplete="no" value={password} onChange={(event) => { setPassword(event.target.value); setPasswordError(""); }} />
                {passwordError && <p className="register-input-error">{passwordError}</p>}
            </div>

            <div className="register-input-group">
                <label htmlFor="password-confirmation">Password Confirmation</label>
                <input id="password-confirmation" name="passwordConfirmation" type="password" placeholder="Enter your confirmation password:" autoComplete="no" value={passwordConfirmation} onChange={(event) => { setPasswordConfirmation(event.target.value); setPasswordConfirmationError(""); }} />
                {passwordConfirmationError && <p className="register-input-error">{passwordConfirmationError}</p>}
            </div>

            <div className="register-button-container">
                <button type="submit" className="register-button" disabled={loading}>{loading ? "Signing up..." : "Sign up"}</button>
            </div>
        </form>
    );
}

export function RegisterForm_PassToBackend(){

}

/* Register() --> the react JS component rendering */
export function Register(){
    return (
        <main className="register-page">
            <section className="register-information">
                <div className="register-background" style={{ backgroundImage: `url(${CoEBackground})` }}></div>
                <div className="register-background-overlay"></div>
                <div className="register-information-content">
                    <p className="register-welcome">Welcome to the faculty of</p>
                    <h1 className="register-digitalmedia-engineering">Digital Media Engineering</h1>
                    <div className="register-images">
                        <img src={GraduationCoEImage} alt="CoE graduation students image"/>
                        <img src={DMEStudio} alt="DME student at studio" />
                    </div>
                    <p className="register-university">Khon Kaen university</p>
                    <p className="register-description">
                        Creating interesting digital experience by design, develop, interactive digital media
                        <br className="desktop-break"/>with optimizing technology systems
                    </p>
                    <p className="register-footer-text">Come to join us and start the successful future career</p>
                </div>
            </section>

            <section className="register-form-section">
                <div className="register-form-container">
                    <h2 className="account-create-title">Create your account</h2>
                    
                    {/* The form for register */}
                    <RegisterSignup />

                    <div className="register-login">
                        <span className="have-acc-already">Already have an account?</span>
                        <Link to="/login">Login</Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

