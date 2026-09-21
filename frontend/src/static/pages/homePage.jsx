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
    const [newsImageFile, setNewsImageFile] = useState(null);
    const [priority, setPriority] = useState("Low");
    const [newsContent, setNewsContent] = useState("");
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedNewsIds, setSelectedNewsIds] = useState([]);
    const [deletingNews, setDeletingNews] = useState(false);

    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchCategory, setSearchCategory] = useState("");

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

const GetNews = async (categoryFilter = searchCategory) => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
        alert("The date is invalid");
        return;
    }

    try {
        setLoadingNews(true);

        const params = new URLSearchParams();

        if (searchKeyword.trim()) {
            params.set("keyword", searchKeyword.trim());
        }

        // Use the clicked category, or the current category when omitted.
        if (categoryFilter) {
            params.set("category", categoryFilter);
        }

        if (dateFrom) {
            const startDate = new Date(`${dateFrom}T00:00:00`);
            params.set("from", startDate.toISOString());
        }

        if (dateTo) {
            const endDate = new Date(`${dateTo}T00:00:00`);
            endDate.setDate(endDate.getDate() + 1);

            params.set("before", endDate.toISOString());
        }

        const response = await fetch(`http://localhost:5000/api/news?${params.toString()}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || "Unable to get news.");
            return;
        }

        setNews(result.news || []);
        setSelectedNewsIds([]);
        setSelectionMode(false);
    } 
    
    catch (error) {
        console.error("Get news error:", error);
        alert("Cannot get the news");
    } 
    
    finally {
        setLoadingNews(false);
    }
};

    const SearchNews = () => {
        setCategoryDropdownOpen(false);
        setDatePickerOpen(false);
        GetNews();
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
        setNewsImageFile(null);
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
        setNewsImageFile(null);
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

        try {
            const formData = new FormData();

            formData.append("news_title", newsTitle.trim());
            formData.append("category", category);
            formData.append("published_date", publishedDate ? new Date(publishedDate).toISOString() : new Date().toISOString());
            formData.append("priority", GetPriorityValue(priority).toString());
            formData.append("news_content", newsContent.trim());

            if (newsImage) {
                formData.append("news_image", newsImage);
            }

            if (newsImageFile) {
                formData.append("news_image_file", newsImageFile);
            }

            let response;

            if (editingNews) {
                response = await fetch(`http://localhost:5000/api/news/${editingNews.news_id}`, {
                    method: "PUT",
                    credentials: "include",
                    body: formData
                });
            }
            else {
                response = await fetch("http://localhost:5000/api/news", {
                    method: "POST",
                    credentials: "include",
                    body: formData
                });
            }

            const result = await response.json();

            console.log("Save news response:", result);

            if (!response.ok) {
                alert(result.message || "Unable to save news.");
                return;
            }

            await GetNews();
            CloseNewsForm();
            alert(editingNews ? "News updated successfully." : "News added successfully.");
        }
        catch (error) {
            console.error("Save news error:", error);
            alert("Unable to save news.");
        }
    };

    const ToggleSelectionMode = () => {
        if (!isAdmin || deletingNews) {
            return;
        }

        setSelectionMode(previous => !previous);
        setSelectedNewsIds([]);
    };

    const ToggleNewsSelection = (newsId) => {
        if (!isAdmin || !selectionMode || deletingNews) {
            return;
        }

        const id = String(newsId);

        setSelectedNewsIds(previous =>
            previous.includes(id)
                ? previous.filter(selectedId => selectedId !== id)
                : [...previous, id]
        );
    };

    const DeleteSelectedNews = async () => {
        if (!isAdmin || !selectionMode || deletingNews) {
            return;
        }

        if (selectedNewsIds.length === 0) {
            alert("Please select news to delete.");
            return;
        }

        const confirmed = window.confirm(`Are you sure to delete these news (${selectedNewsIds.length} selected)?`);

        if (!confirmed) {
            return;
        }

        setDeletingNews(true);

        try {
            const response = await fetch("http://localhost:5000/api/news", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    newsIds: selectedNewsIds
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(result.message || "Cannot delete news.");
                return;
            }

            const deletedIds = new Set(
                result.deletedIds.map(id => String(id))
            );

            setNews(previous => previous.filter(item =>
                    !deletedIds.has(String(item.news_id))
                )
            );

            setSelectedNewsIds(previous =>
                previous.filter(id => !deletedIds.has(id))
            );

            alert(result.message);
        } 
        
        catch (error) {
            console.error("Delete news error:", error);
            alert("Cannot delete news, refresh and try again");
        } 
        
        finally {
            setDeletingNews(false);
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
                            <div className="news-admin-actions-homepage">
                                <button
                                    type="button"
                                    className="add-news-button-homepage"
                                    onClick={OpenAddNews}
                                    disabled={deletingNews}
                                >
                                    <img src={AddNewsIcon} alt="" />
                                    Add News
                                </button>

                                <button
                                    type="button"
                                    className="delete-news-button-homepage"
                                    onClick={DeleteSelectedNews}
                                    disabled={
                                        !selectionMode ||
                                        deletingNews ||
                                        selectedNewsIds.length === 0
                                    }
                                >
                                    {deletingNews
                                        ? "Deleting..."
                                        : `Delete News (${selectedNewsIds.length})`}
                                </button>
                                
                                {/* If we want to delete the news, here we can select the news first before deleting */}
                                <button
                                    type="button"
                                    className={`select-news-button-homepage ${
                                        selectionMode ? "selection-active-homepage" : ""
                                    }`}
                                    onClick={ToggleSelectionMode}
                                    disabled={deletingNews}
                                    aria-pressed={selectionMode}
                                >
                                    {selectionMode ? "Cancel Selection" : "Select News"}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* The searchbar --> type in anything to search*/}
                    <div className="news-controls-homepage">
                        <input
                            type="text"
                            className="news-search-homepage"
                            placeholder="Search for news:"
                            value={searchKeyword}
                            onChange={(event) => setSearchKeyword(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    SearchNews();
                                }
                            }}
                        />

                        <div className="news-category-dropdown">
                            <button
                                type="button"
                                className="news-filter-button"
                                onClick={() =>
                                    setCategoryDropdownOpen(previous => !previous)
                                }
                            >
                                {searchCategory === "other"
                                    ? "Other News"
                                    : searchCategory || "Choose categories"}
                            </button>
                            
                            {/* This category will be searching... based on what user click */}
                            {categoryDropdownOpen && (
                                <div className="news-category-dropdown-list">
                                    {[
                                        { label: "Faculty News", value: "Faculty News" },
                                        { label: "KKU News", value: "KKU News" },
                                        { label: "Award", value: "Award" },
                                        { label: "Field Study", value: "Field Study" },
                                        { label: "Other News", value: "others" }
                                    ].map(option => (
                                        <button
                                            type="button"
                                            key={option.value}
                                            onClick={() => {
                                                setSearchCategory(option.value);
                                                setCategoryDropdownOpen(false);
                                                GetNews(option.value);
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
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
                                        {/*News date submit button --> this will apply date to filtering*/}
                                        <button
                                            type="button"
                                            className="news-date-submit-button"
                                            onClick={SearchNews}
                                        >
                                            Submit
                                        </button>
                                </div>
                            )}
                        </div>

                        <button type="button" className="news-search-button" onClick={SearchNews} disabled={loadingNews}>
                            {loadingNews ? "Searching" : "Search"}
                        </button>
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
                            news.map((item) => {
                                const canSelect = isAdmin && selectionMode;

                                const isSelected =
                                    canSelect &&
                                    selectedNewsIds.includes(String(item.news_id));

                                return (
                                    <article
                                        key={item.news_id}
                                        className={[
                                            "news-card-homepage",
                                            canSelect ? "news-card-selectable-homepage" : "",
                                            isSelected ? "news-card-selected-homepage" : ""
                                        ].filter(Boolean).join(" ")}
                                        tabIndex={canSelect ? 0 : undefined}
                                        onClick={(event) => {
                                            if (event.target.closest("button, a")) {
                                                return;
                                            }

                                            ToggleNewsSelection(item.news_id);
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.target !== event.currentTarget) {
                                                return;
                                            }

                                            if (
                                                canSelect &&
                                                (event.key === "Enter" || event.key === " ")
                                            ) {
                                                event.preventDefault();
                                                ToggleNewsSelection(item.news_id);
                                            }
                                        }}
                                    >
                                        <div className="news-card-image-homepage">
                                            {item.news_image ? (
                                                <img
                                                    src={item.news_image}
                                                    alt={item.news_title}
                                                />
                                            ) : (
                                                <div className="news-no-image-homepage">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        <div className="news-card-content-homepage">
                                            <h3>{item.news_title}</h3>

                                            <p className="news-card-category-homepage">
                                                {item.category}
                                            </p>

                                            <div className="news-card-bottom-homepage">
                                                <span className="news-card-date-homepage">
                                                    {new Date(
                                                        item.published_date
                                                    ).toLocaleDateString("en-GB")}
                                                </span>

                                                <div className="news-card-buttons-homepage">
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            className="edit-news-button-homepage"
                                                            onClick={() => OpenEditNews(item)}
                                                            disabled={deletingNews}
                                                        >
                                                            Edit news
                                                        </button>
                                                    )}

                                                    {/* The news read more button */}
                                                    <Link
                                                        to={`/news/${item.news_id}`}
                                                        className="read-more-button-homepage"
                                                    >
                                                        Read more
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })
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
                                    {/* Here I create the option for the dropdown list */}
                                    <option value="Faculty News">Faculty News</option>
                                    <option value="KKU News">KKU News</option>
                                    <option value="Award">Award</option>
                                    <option value="Field Study">Field Study</option>
                                    <option value="other">Other News</option>
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
                                <div className="news-image-upload-homepage">
                                    <input
                                        id="news-image-file"
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        onChange={(event) => {
                                            const file = event.target.files[0];

                                            if (file) {
                                                setNewsImageFile(file);
                                                console.log("Selected news image:", file.name);
                                            }
                                        }}
                                    />
                                    {newsImageFile && <span className="news-selected-image-name">{newsImageFile.name}</span>}
                                    {!newsImageFile && editingNews && newsImage && <span className="news-selected-image-name">Current image will be kept</span>}
                                </div>
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

