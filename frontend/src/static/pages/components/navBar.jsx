import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import "../../css_styles/css_pages/navBar.css";
import DMELogo from "../../../assets/icons/DME_logo1.png";
import userICon from "../../../assets/icons/defaultUser.png";
import ToggleMenuButton from "../../../assets/icons/DropDownMenu.png";

export function NavigationBar(){
    const [menuOpen, setMenuOpen] = useState(false);
    const [username, setUsername] = useState("Guest");

    const toggleMenu = () => {
        setMenuOpen(prev => !prev);
        console.log("Toggled menu on mobile");
    }

    const closeMenu = () => {
        setMenuOpen(false);
    }

      useEffect(() => {
        const CheckSession = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/session", {
                    credentials: "include"
                });

                const result = await response.json();

                if (result.loggedIn) {
                    setUsername(result.user.username);
                } 
                else {
                    setUsername("Guest");
                }
            } 
            catch (error) {
                console.error("Session check error" + error);
                setUsername("Guest");
            }
        };

        CheckSession();
    }, new Array());

    /*
        This code sends to the backend to call req.session.destroy()
        then the session will be terminate
    */
    const handleLogout = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/api/logout", { // send to logout
                method: "POST",
                credentials: "include"
            });

            const result = await response.json();

            if (response.ok) {
                window.location.reload();
                setUsername("Guest");
                closeMenu();
                navigate("/");
            } 
            else {
                console.error("Logout failed:", result);
            }
        } 
        catch (error) {
            console.error("Logout error:", error);
        }
    };

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
                <Link to="/program" className="nav-button" onClick={closeMenu}>Programs</Link>
                <Link to="/projects" className="nav-button" onClick={closeMenu}>Projects</Link>
                <Link to="/tuition" className="nav-button" onClick={closeMenu}>Tuition Fee</Link>
                <Link to="/occupation" className="nav-button" onClick={closeMenu}>Occupation</Link>
                <Link to="/3d-relax" className="nav-button" onClick={closeMenu}>3D relax zone</Link>
                <Link to="/contacts" className="nav-button" onClick={closeMenu}>Contacts & FAQ</Link>
            </div>

            <div className="navbar-user">
                <div className="navbar-user-display">
                    <img src={userICon} alt="User icon" className="user-image-navigation"/>
                    <span className="username-nav-display">{username}</span>
                </div>
                <div className="user-dropdown">
                    <Link to="/">Profile Settings</Link>
                    {username === "Guest" ? (
                        <Link to="/login">Login</Link>
                    ) : (
                        <Link to="/" onClick={handleLogout}>Logout</Link>
                    )}
                </div>
            </div>
        </nav>
    )
}

