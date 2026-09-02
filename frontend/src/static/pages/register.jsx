import { useState } from 'react';
import { Link } from "react-router-dom";
import "../css_styles/css_pages/registerPage_style.css"
import CoEBackground from "../../assets/images/CoEBuilding2.png";
import GraduationCoEImage from "../../assets/images/Dme_graduate1.png";
import DMEStudio from "../../assets/images/Dme_239_studio1.png";

export function Register(){
    return (
        <main className="register-page">
        <section className="register-information">
            <div className="register-background" style={{ backgroundImage: `url(${CoEBackground})` }}></div>
            <div className="register-background-overlay"></div>
            
            <div className="register-information-content">
                <p className="register-welcome">Welcome to Faculty of</p>
                <h1 className="register-digitalmedia-engineering">Digital Media Engineering</h1>
                <div className="register-images">
                    <img src= {GraduationCoEImage} alt = "CoE graduation students image"/>
                    <img src={DMEStudio} alt="DME student at studio" />
                </div>

                <p className="register-university">Khon Kaen university</p>
                <p className="register-description">
                    Creating interesting digital experience by design, develop, interactive digital media 
                    <br className="desktop-break"/>with optimizing technology systems
                </p>

                <p className="register-footer-text">
                    Come to join us and start the successful future career
                </p>
            </div>
        </section>

        <section className="register-form-section">
            <div className="register-form-container">
                <h2 className="account-create-title">Create your account</h2>

                {/*The form for register*/}
                <form>
                    <div className="register-input-group">
                        <label htmlFor="username">Username: </label>
                        <input id="username" name="username" type="text" placeholder="Enter your username:" autoComplete="on" />
                    </div>

                    <div className="register-input-group">
                        <label htmlFor="email">Email Address: </label>
                        <input id="email" name="email" type="email" placeholder="Enter your email address: " autoComplete="yes" />
                    </div>

                    <div className="register-input-group">
                        <label htmlFor="password">Password: </label>
                        <input id="password" name="password" type="password" placeholder="Enter your password: " autoComplete="no" />
                    </div>

                    <div className="register-input-group">
                        <label htmlFor = "password-confirmation">Password Confirmation</label>
                        <input id="password-confirmation" name="passwordConfirmation" type="password" placeholder="Enter your confirmation password: " autoComplete="off" />
                    </div>

                    <div className="register-button-container">
                        <button type="submit" className="register-button">Sign up</button>
                    </div>
                </form>
                
                <div className="register-login">
                    <span className="have-acc-already">Already have an account? </span>
                    <Link to="/login">Login</Link>
                </div>
            </div>
        </section>

    </main>
    )
}

