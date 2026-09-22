import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NavigationBar } from "./components/navBar";
import "../css_styles/css_pages/about_page_style.css";
import CoEOpenHouse from "../../assets/images/CoE_openhouse.png";
import CoEBackground from "../../assets/images/ENKKU_50year.png";

export function About() {
    return (
        <Fragment>
            <NavigationBar />
                <main className = "about-page">
                    <section className="about-section" style = {{ "--about-background-image": `url(${CoEBackground})`}}>
                        <h1 style={{fontFamily: "Tilt Warp", fontWeight: "normal", fontSize: "45px"}}>About Digital Media Engineering</h1>
                        <p>Digital Media Engineering at Khon Kaen University, Faculty of Engineering</p>
                    </section>
                </main>
        </Fragment>
    )
}