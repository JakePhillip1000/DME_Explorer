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
                <h1 classname="register-digitalmedia-engineering">Digital Media Engineering</h1>
                <div classname="register-images">
                    <img src= {GraduationCoEImage} alt = "CoE graduation students image"/>
                    <img src={DMEStudio} alt="DME student at studio" />
                </div>

                <p className="register-university">Khon Kaen university</p>
                <p className="register-description">
                    Creating interesting digital experience by design, develop, interactive digital media 
                    <br className="desktop-break"/>with optimizing technology systems
                </p>
            </div>
        </section>
    </main>
    )
}