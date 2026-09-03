import { Link } from "react-router-dom";
import "../css_styles/css_pages/login_page.css";
import CoEBackground from "../../assets/images/CoEBuilding2.png";
import GraduationCoEImage from "../../assets/images/Dme_graduate1.png";
import DMEStudio from "../../assets/images/Dme_239_studio1.png";

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
                    
                    <form className="login-form">
                        <div className="login-input-group">
                            <label className="login-input-label" htmlFor="username">Username</label>
                            <input className="login-input" id="username" name="username" type="text" placeholder="Enter your username" autoComplete="username"/>
                        </div>
                        <div className="login-input-group">
                            <label className="login-input-label" htmlFor="password">Password:</label>
                            <input className="login-input" id="password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password"/>
                        </div>
                        <div className="login-options">
                            <label className="remember-me">
                                <input className="remember-checkbox" type="checkbox" name="rememberMe"/>
                                <span className="remember-text">Remember me</span>
                            </label>
                            <Link className="forgot-password" to="/forgot-password">Forgot the password?</Link>
                        </div>
                        <div className="login-button-container">
                            <button className="login-button" type="submit">Login</button>
                        </div>
                    </form>
                    <div className="login-register">
                        <span className="no-account-text">Don't have an account?</span>
                        <Link className="signup-link" to="/register">Sign up</Link>
                    </div>

                </div>
            </section>
        </main>
    )
}
