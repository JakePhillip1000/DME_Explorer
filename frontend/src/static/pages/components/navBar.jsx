import { useEffect, useState, useActionState } from "react";
import { Link } from "react-router-dom"
import "../../css_styles/css_pages/navBar.css";
import DMELogo from "../../../assets/icons/DME_logo1.png"
import userICon from "../../../assets/icons/defaultUser.png"

export function NavigationBar(){
    return (
        <nav className = "navbar">
            <div className="navbar-logo">
                <Link to="/"> 
                    <img src = {DMELogo} alt="DME logo"></img>
                </Link>
            </div>

            <div className="navbar-menu">
                <Link to="/" className="nav-button">Home</Link>
                <Link to="/about" className="nav-button">About</Link>
                <Link to="/" className="nav-button">Programs</Link>
                <Link to="/" className="nav-button">Programs</Link>
                <Link to="/" className="nav-button">Projects</Link>
                <Link to="/" className="nav-button">Tuition Fee</Link>
                <Link to="/" className="nav-button">Occupation</Link>
                <Link to="/" className="nav-button">3D relax zone</Link>
                <Link to="/" className="nav-button">Contacts & FAQ</Link>
            </div>

            <div className="navbar-user">
                <div className="navbar-user-display">
                    <img src={userICon} alt="User icon" className="user-image-navigation"/>
                    <span className="username-nav-display">_jakePhillip</span>
                </div>

                <div className="user-dropdown">
                    <Link to="/">Profile Settings</Link>
                    <Link to="/">Logout</Link>
                </div>
            </div>
        </nav>
    )
}

