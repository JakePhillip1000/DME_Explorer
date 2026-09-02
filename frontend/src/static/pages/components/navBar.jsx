import { useState } from "react";
import { Link } from "react-router-dom";

import "../../css_styles/css_pages/navBar.css";
import DMELogo from "../../../assets/icons/DME_logo1.png";
import userICon from "../../../assets/icons/defaultUser.png";
import ToggleMenuButton from "../../../assets/icons/DropDownMenu.png";

export function NavigationBar(){
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => {
        setMenuOpen(prev => !prev);
        console.log("Toggled menu on mobile");
    }

    const closeMenu = () => {
        setMenuOpen(false);
    }
    
    return (
        <nav className="navbar">

            <button className="mobile-menu-button" onClick={toggleMenu} aria-label="Navigation toggle button for mobile" aria-expanded={menuOpen}>
                <img src={ToggleMenuButton} alt="menu toggle mobile" />
            </button>

            <div className="navbar-logo">
                <Link to="/">
                    <img src={DMELogo} alt="DME logo"></img>
                </Link>
            </div>

            <div className={`navbar-menu ${menuOpen ? "navbar-menu-mobile-open" : ""}`}>
                <Link to="/" className="nav-button" onClick={closeMenu}>Home</Link>
                <Link to="/about" className="nav-button" onClick={closeMenu}>About</Link>
                <Link to="/" className="nav-button" onClick={closeMenu}>Programs</Link>
                <Link to="/" className="nav-button" onClick={closeMenu}>Programs</Link>
                <Link to="/" className="nav-button" onClick={closeMenu}>Projects</Link>
                <Link to="/" className="nav-button" onClick={closeMenu}>Tuition Fee</Link>
                <Link to="/" className="nav-button" onClick={closeMenu}>Occupation</Link>
                <Link to="/" className="nav-button" onClick={closeMenu}>3D relax zone</Link>
                <Link to="/" className="nav-button" onClick={closeMenu}>Contacts & FAQ</Link>
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

