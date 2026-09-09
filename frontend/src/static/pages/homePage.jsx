import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NavigationBar } from "./components/navBar";
import "../css_styles/css_pages/homePage_style.css";
import HomeBackground from "../../assets/images/ENKKU_50year.png";
import CoEbuildingHome1 from "../../assets/images/CoE1.png";
import DmeLearningHomePage1 from "../../assets/images/Dme_learn1.png";
import DmeLearningHomePage2 from "../../assets/images/Dme_learn2.png";
import EnkkuIcon from "../../assets/icons/ENKKU_logo2.png";
import DMELogo from "../../assets/icons/DME_logo1.png";
import AddNewsIcon from "../../assets/icons/add_box.png";
import CalendarIcon from "../../assets/icons/date_range.png";

export function Home() {
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [username, setUsername] = useState("Guest");
    const [news, setNews] = useState([]);
    const [newsFormOpen, setNewsFormOpen] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [loadingNews, setLoadingNews] = useState(true);

    const [newsTitle, setNewsTitle] = useState("");
    const [category, setCategory] = useState("Faculty News");
    const [publishedDate, setPublishedDate] = useState("");
    const [newsImage, setNewsImage] = useState("");
    const [priority, setPriority] = useState("Low");
    const [newsContent, setNewsContent] = useState("");
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const isAdmin = username === "admin";

    useEffect(() => {
        CheckSession();
        GetNews();
    }, []);

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
            console.error("Session error:", error);
            setUsername("Guest");
        }
    };

    const GetNews = async () => {
        try {
            setLoadingNews(true);

            const response = await fetch("http://localhost:5000/api/news");
            const result = await response.json();

            if (response.ok) {
                setNews(result.news || []);
            }
            else {
                console.error("Get news failed:", result);
            }
        }
        catch (error) {
            console.error("Get news error:", error);
        }
        finally {
            setLoadingNews(false);
        }
    };

    const OpenAddNews = () => {
        if (!isAdmin) {
            return;
        }

        setEditingNews(null);
        setNewsTitle("");
        setCategory("Faculty News");
        setPublishedDate(new Date().toISOString().split("T")[0]);
        setNewsImage("");
        setPriority("Low");
        setNewsContent("");
        setNewsFormOpen(true);
    };

    const OpenEditNews = (selectedNews) => {
        if (!isAdmin) {
            return;
        }

        setEditingNews(selectedNews);
        setNewsTitle(selectedNews.news_title || "");
        setCategory(selectedNews.category || "Faculty News");
        setPublishedDate(selectedNews.published_date ? selectedNews.published_date.split("T")[0] : "");
        setNewsImage(selectedNews.news_image || "");
        setPriority(GetPriorityName(selectedNews.priority));
        setNewsContent(selectedNews.news_content || "");
        setNewsFormOpen(true);
    };

    const CloseNewsForm = () => {
        setNewsFormOpen(false);
        setEditingNews(null);
    };

    const GetPriorityValue = (priorityName) => {
        if (priorityName === "High") {
            return 3;
        }

        if (priorityName === "Medium") {
            return 2;
        }

        return 1;
    };

    const GetPriorityName = (priorityValue) => {
        if (priorityValue === 3) {
            return "High";
        }

        if (priorityValue === 2) {
            return "Medium";
        }

        return "Low";
    };

    const SaveNews = async (event) => {
        event.preventDefault();

        if (!isAdmin) {
            alert("Only admin can modify news.");
            return;
        }

        if (!newsTitle.trim()) {
            alert("Please enter the news title.");
            return;
        }

        if (!newsContent.trim()) {
            alert("Please enter the news contents.");
            return;
        }

        const newsData = {
            news_title: newsTitle.trim(),
            category: category,
            published_date: publishedDate ? new Date(publishedDate).toISOString() : new Date().toISOString(),
            news_image: newsImage.trim(),
            priority: GetPriorityValue(priority),
            news_content: newsContent.trim()
        };

        try {
            let response;

            if (editingNews) {
                response = await fetch(`http://localhost:5000/api/news/${editingNews.news_id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify(newsData)
                });
            }
            else {
                response = await fetch("http://localhost:5000/api/news", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify(newsData)
                });
            }

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Unable to save news.");
                return;
            }

            await GetNews();
            CloseNewsForm();
        }
        catch (error) {
            console.error("Save news error:", error);
            alert("Unable to save news.");
        }
    };

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

                <section className="news-section-homepage">
                    <div className="news-header-homepage">
                        <h2>Latest News update</h2>

                        {isAdmin && (
                            <button className="add-news-button-homepage" onClick={OpenAddNews}>
                                <img src={AddNewsIcon} alt="Add news"/>
                                Add News
                            </button>
                        )}
                    </div>

                    <div className="news-controls-homepage">
                        <input
                            type="text"
                            className="news-search-homepage"
                            placeholder="Search for news:"
                        />

                        <div className="news-category-dropdown">
                            <button className="news-filter-button" onClick={() => setCategoryDropdownOpen(prev => !prev)}>
                                Choose categories
                            </button>
                            {categoryDropdownOpen && (
                                <div className="news-category-dropdown-list">
                                    <button onClick={() => { setCategory("Faculty News"); setCategoryDropdownOpen(false); console.log("Category:", "Faculty News"); }}>Faculty News</button>
                                    <button onClick={() => { setCategory("KKU News"); setCategoryDropdownOpen(false); console.log("Category:", "KKU News"); }}>KKU News</button>
                                    <button onClick={() => { setCategory("Award"); setCategoryDropdownOpen(false); console.log("Category:", "Award"); }}>Award</button>
                                    <button onClick={() => { setCategory("Field Study"); setCategoryDropdownOpen(false); console.log("Category:", "Field Study"); }}>Field Study</button>
                                </div>
                            )}
                        </div>

                        <div className="news-date-picker">
                            <button type="button" className="news-date-button" onClick={() => setDatePickerOpen(prev => !prev)}>
                                Choose Date
                                <img src={CalendarIcon} alt="Calendar"/>
                            </button>
                            {datePickerOpen && (
                                <div className="news-date-dropdown">
                                    <div className="news-date-input-row">
                                        <span>From:</span>
                                        <button
                                            type="button"
                                            className="news-date-select-button"
                                            onClick={() => document.getElementById("news-date-from").showPicker()}
                                        >
                                            {dateFrom ? new Date(dateFrom + "T00:00:00").toLocaleDateString("en-GB") : "Select date"}
                                            <img src={CalendarIcon} alt="Calendar"/>
                                        </button>
                                        <input
                                            id="news-date-from"
                                            type="date"
                                            value={dateFrom}
                                            max={dateTo || undefined}
                                            onChange={(event) => {
                                                const selectedDate = event.target.value;
                                                const today = new Date().toISOString().split("T")[0];
                                                setDateFrom(selectedDate);
                                                if (!dateTo) {
                                                    setDateTo(selectedDate <= today ? today : selectedDate);
                                                }
                                                console.log("Date From:", selectedDate);
                                            }}
                                        />
                                    </div>
                                    <div className="news-date-input-row">
                                        <span>To:</span>
                                        <button
                                            type="button"
                                            className="news-date-select-button"
                                            onClick={() => document.getElementById("news-date-to").showPicker()}
                                        >
                                            {dateTo ? new Date(dateTo + "T00:00:00").toLocaleDateString("en-GB") : "Select date"}
                                            <img src={CalendarIcon} alt="Calendar"/>
                                        </button>
                                        <input
                                            id="news-date-to"
                                            type="date"
                                            value={dateTo}
                                            min={dateFrom || undefined}
                                            onChange={(event) => {
                                                const selectedDate = event.target.value;
                                                const today = new Date().toISOString().split("T")[0];
                                                setDateTo(selectedDate);
                                                if (!dateFrom) {
                                                    setDateFrom(selectedDate >= today ? today : selectedDate);
                                                }
                                                console.log("Date To:", selectedDate);
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="news-date-submit-button"
                                        onClick={() => {
                                            console.log("Date From:", dateFrom);
                                            console.log("Date To:", dateTo);
                                            setDatePickerOpen(false);
                                        }}
                                    >
                                        Submit
                                    </button>
                                </div>
                            )}
                        </div>

                        <button className="news-search-button">Search</button>
                    </div>

                    {/*
                    
                    <div className="view-all-news-homepage">
                        <Link to="/news">View all news</Link>
                    </div>

                    */}

                    <div className="news-grid-homepage">
                        {loadingNews ? (
                            <p className="news-loading-homepage">Loading news...</p>
                        ) : news.length === 0 ? (
                            <p className="news-empty-homepage">No news available.</p>
                        ) : (
                            news.map((item) => (
                                <article className="news-card-homepage" key={item.news_id}>
                                    <div className="news-card-image-homepage">
                                        {item.news_image ? (
                                            <img src={item.news_image} alt={item.news_title}/>
                                        ) : (
                                            <div className="news-no-image-homepage">No image</div>
                                        )}
                                    </div>

                                    <div className="news-card-content-homepage">
                                        <h3>{item.news_title}</h3>

                                        <p className="news-card-category-homepage">{item.category}</p>
                                        <div className="news-card-bottom-homepage">
                                            <span className="news-card-date-homepage">
                                                {new Date(item.published_date).toLocaleDateString("en-GB")}
                                            </span>

                                            <div className="news-card-buttons-homepage">
                                                {isAdmin && (
                                                    <button className="edit-news-button-homepage" onClick={() => OpenEditNews(item)}>Edit news</button>
                                                )}

                                                <Link to={`/news/${item.news_id}`} className="read-more-button-homepage">Read more</Link>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </main>
            
            {/* Add news for admin */}
            {newsFormOpen && isAdmin && (
                <div className="news-modal-background">
                    <div className="news-modal-homepage">
                        <div className="news-form-header-homepage">
                            <img
                                src={DMELogo}
                                alt="DME logo"
                                className="news-form-header-logo"
                            />

                            <h2>{editingNews ? "Edit DME News" : "Add DME News"}</h2>

                            <span>(for admin only)</span>
                        </div>

                        <form className="news-form-homepage" onSubmit={SaveNews}>
                            <div className="news-form-row">
                                <label>News Title:</label>

                                <input
                                    type="text"
                                    value={newsTitle}
                                    onChange={(event) => setNewsTitle(event.target.value)}
                                />
                            </div>

                            <div className="news-form-row">
                                <label>Category:</label>

                                <select
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                >
                                    <option value="Faculty News">Faculty News</option>
                                    <option value="KKU News">KKU News</option>
                                    <option value="Award">Award</option>
                                    <option value="Field Study">Field Study</option>
                                </select>
                            </div>

                            <div className="news-form-row">
                                <label>Publish Date:</label>

                                <input
                                    type="date"
                                    value={publishedDate}
                                    onChange={(event) => setPublishedDate(event.target.value)}
                                />
                            </div>

                            <div className="news-form-row">
                                <label>News image:</label>

                                <input
                                    type="text"
                                    value={newsImage}
                                    onChange={(event) => setNewsImage(event.target.value)}
                                    placeholder="Paste image URL here"
                                />
                            </div>

                            <div className="news-form-row news-priority-row">
                                <label>Priority:</label>

                                <div className="news-priority-options">
                                    <label>
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="High"
                                            checked={priority === "High"}
                                            onChange={(event) => setPriority(event.target.value)}
                                        />
                                        <span>High</span>
                                    </label>

                                    <label>
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="Medium"
                                            checked={priority === "Medium"}
                                            onChange={(event) => setPriority(event.target.value)}
                                        />
                                        <span>Medium</span>
                                    </label>

                                    <label>
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="Low"
                                            checked={priority === "Low"}
                                            onChange={(event) => setPriority(event.target.value)}
                                        />
                                        <span>Low</span>
                                    </label>
                                </div>
                            </div>

                            <div className="news-form-content-row">
                                <label>News contents:</label>

                                <textarea value={newsContent} onChange={(event) => setNewsContent(event.target.value)}></textarea>
                            </div>

                            <div className="news-form-buttons-homepage">
                                <button type="button" className="quit-news-button-homepage" onClick={CloseNewsForm}>
                                    Quit
                                </button>

                                <button type="submit" className="save-news-button-homepage">
                                    Save & Quit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Fragment>
    );
}

