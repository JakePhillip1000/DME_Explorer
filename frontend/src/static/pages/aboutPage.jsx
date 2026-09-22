import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NavigationBar } from "./components/navBar";
import "../css_styles/css_pages/about_page_style.css";
import CoEOpenHouse from "../../assets/images/CoE_openhouse.png";
import CoEBackground from "../../assets/images/ENKKU_50year.png";

export function About() {
   
    const GetAPI = async () => {
        const API1 = "https://www.en.kku.ac.th/web/wp-json/wp/v2";
        const API2 = "https://www.en.kku.ac.th/web/wp-json";

        let response = await fetch(`${API}/pages?search=computer&per_page=100`);
        let pages = await response.json();

        console.log(pages);
        console.log(Object.keys(pages.routes));
    }

    return (
        <Fragment>
            <NavigationBar />
                <main className = "about-page">
                    <section className="about-section" style = {{ "--about-background-image": `url(${CoEBackground})`}}>
                        <h1 className="about-heading-title">About Digital Media Engineering</h1>
                        <p className="about-heading-description">Digital Media Engineering at Khon Kaen University, Faculty of Engineering</p>
                    </section>

                    <section className="about-information">
                        <div className="about-layout">
                            <article className="about-panel about-introduction">
                                <h2 className="about-panel-title">
                                    What is Digital Media Engineering?
                                </h2>
                                <div className="about-introduction-content">
                                    <div className="about-introduction-image-container">
                                        <img className="about-introduction-image" src={CoEOpenHouse} alt="CoE openhouse" />
                                    </div>

                                    <p className="about-introduction-description">
                                        Bachelor of Engineering, Digital Media Engineering Program at Khon Kaen university 
                                        is an international engineering program which focused on engineering, science, 
                                        mathematics combine together with art.  Students will learn software engineering fundamentals, 
                                        with digital media production, 3D animation, interactive media, Artificial Intelligence, 
                                        video game programming and software development.
                                    </p>
                                </div>
                            </article>

                            <article className="about-panel about-learning">
                                <h2 className="about-panel-title">What do we learn</h2>

                                <ul className="about-main-list">
                                    <li className="about-main-list-item">
                                        <span className="about-list-text">
                                            Students will learn about fundamentals of computer programming, data structure and algorithm,
                                            computer graphics in year 1-2, then specialized in year 3-4 through elective
                                            courses. Elective courses categories inlcude:
                                        </span>

                                        <ul className="about-sub-list">
                                            <li className="about-sub-list-item">
                                                Game development and interactive
                                                media
                                            </li>

                                            <li className="about-sub-list-item">
                                                Artificial Intelligence
                                            </li>

                                            <li className="about-sub-list-item">
                                                Digital Media Production
                                            </li>

                                            <li className="about-sub-list-item">
                                                Software development
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </article>

                            <article className="about-panel about-objectives">
                                <h2 className="about-panel-title">Program Objective and Learning Outcomes</h2>
                                
                                    <ol className="about-objectives-list">
                                        <li className="about-objectives-item">
                                            Can apply Digital Media Engineering
                                            knowledge and modern technology to develop
                                            and implement solutions effectively.
                                        </li>

                                        <li className="about-objectives-item">
                                            Can think critically and demonstrate
                                            leadership when presenting and explaining
                                            projects or creating their own business.
                                        </li>

                                        <li className="about-objectives-item">
                                            Demonstrates lifelong and continuous
                                            learning.
                                        </li>

                                        <li className="about-objectives-item">
                                            Can demonstrate effective communication,
                                            teamwork, and ethical responsibility in
                                            professional practice.
                                        </li>

                                        <li className="about-objectives-item">
                                            Can create and implement media such as
                                            interactive media and entertainment media.
                                        </li>
                                    </ol>
                            </article>

                            <article className="about-panel about-vision">
                                <h2 className="about-panel-title">Program Visions and Missions</h2>

                                <div className="about-vision-section">
                                    <h3 className="about-subheading">Visions:</h3>

                                    <ul className="about-vision-list">
                                        <li className="about-vision-item">
                                            Creating Digital Media Engineering
                                            students who understand how to use
                                            computer technologies.
                                        </li>

                                        <li className="about-vision-item">
                                            Creating engineers who can design,
                                            build, and develop digital media
                                            products using creative skills.
                                        </li>
                                    </ul>
                                </div>

                                <div className="about-mission-section">
                                    <h3 className="about-subheading">
                                        Missions:
                                    </h3>

                                    <ul className="about-mission-list">
                                        <li className="about-mission-item">
                                            Provide strong, high-quality education to students.
                                        </li>
                                        <li className="about-mission-item">
                                            To produce engineer withe good practical skills and entrepreneurial mindset
                                        </li>
                                    </ul>
                                </div>
                            </article>

                            {/* Here in this section, I will add more information abt the professors in DME and COE*/}
                            {/* https://www.en.kku.ac.th/web/wp-json  --> ENKKU REST API wordpress*/}
                        
                        </div>
                    </section>
                </main>
        </Fragment>
    )
}