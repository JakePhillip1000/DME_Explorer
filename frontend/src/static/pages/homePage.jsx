import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NavigationBar } from "./components/navBar";
import "../css_styles/css_pages/homePage_style.css";
import HomeBackground from "../../assets/images/ENKKU_50year.png";
import CoEbuildingHome1 from "../../assets/images/CoE1.png";
import DmeLearningHomePage1 from "../../assets/images/Dme_learn1.png";
import DmeLearningHomePage2 from "../../assets/images/Dme_learn2.png";
import EnkkuIcon from "../../assets/icons/ENKKU_logo2.png";

export function Home() {
    useEffect(() => {
        const CheckSession = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/session", {
                    credentials: "include"
                });

                const result = await response.json();
                console.log("Session result: " + result);

                if (result.loggedIn) {
                    console.log("Logged-in user:", result.user);
                    console.log("Username:", result.user.username);
                }
                else {
                    console.log("No user login");
                }
            }
            catch (err) {
                console.error("Session error " + err);
            }
        };

        CheckSession();
    }, new Array());

    return (
        <Fragment>
            <NavigationBar />
            <main className="home-page">
                <section className="main-section-homepage" style={{backgroundImage: `url(${HomeBackground})`}}>
                    <div className="main-content-homepage">
                        <div className="main-corner-top-homepage"></div>
                        <div className="main-text-homepage">
                            <h2>Welcome to the faculty of</h2>
                            <h1>Digital Media<br/>Engineering</h1>
                            <p>Come and join us to start a successful future career together</p>
                            <div className="homepage-buttons">
                                <Link to="/programs" className="program-and-3d-button">View our programs</Link>
                                <Link to="/3d_zone" className="program-and-3d-button">Live chat & 3D world</Link>
                            </div>
                        </div>
                        <div className="main-corner-bottom"></div>
                    </div>
                    <div className="main-images-homepage">
                        <div className="homepage-image coe-building-homepage">
                            <img src={CoEbuildingHome1} alt="Computer Engineering Khon Kaen University"/>
                        </div>
                        <div className="homepage-image dme-learning1-homepage">
                            <img src={DmeLearningHomePage1} alt="Smart classroom 1"/>
                        </div>
                        <div className="homepage-image2 image-classroom-small">
                            <img src={DmeLearningHomePage2} alt="DME Smart classroom 2"/>
                        </div>
                    </div>
                    <img className="Enkku-logo-homepage" src={EnkkuIcon} alt="Khon Kaen University Engineering"/>
                </section>
            </main>
        </Fragment>
    );
}

