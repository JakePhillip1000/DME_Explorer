import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NavigationBar } from "./components/navBar";
import "../css_styles/css_pages/contact_faq.css";

import { ContactMap } from "./components/DME_map";

import clockIcon from "../../assets/icons/clock_icon.png";
import emailIcon from "../../assets/icons/email_icon.png";
import facebookIcon from "../../assets/icons/facebook_icon.png";
import linkIcon from "../../assets/icons/link_icon.png";
import locationIcon from "../../assets/icons/location_icon.png";
import chatbotIcon from "../../assets/icons/chatbot_icon.png";

export function ContactFaq() {
    const [contactForm, setContactForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        topic: "",
        message: "",
    });

    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([
        {
            id: 1,
            sender: "bot",
            text: "Hello, how can I help you?"
        }
    ]);
    
    function HandleContactInput(event) {
        const {name, value} = event.target;
        setContactForm(previousForm => ({...previousForm, [name]: value}));
    }

    function HandleContactSubmit(event) {
        const {name, value} = event.target;
        event.preventDefault();

        console.log(`Submitted contact form: ${contactForm}`)
        alert("Form submitted");
        setContactForm({
            firstName: "",
            lastName: "",
            email: "",
            topic: "",
            message: "",
        });
    }

    function HandleChatSubmit(event){
        event.preventDefault();
        const message = chatInput.trim();
        if (!message) {return;}

        setChatMessages(previousMessage => [
            ...previousMessage, {
                id: Date.now(),
                sender: "user",
                text: message
            }
        ]);
        
        setChatInput("");
    }

    return (
        <Fragment>
            <NavigationBar/>

            <main className="contact-faq-page">
                <ContactMap />

                <section
                    id="contact-main-section"
                    className="contact-main-section"
                >
                    <div
                        id="contact-panels-container"
                        className="contact-panels-container"
                    >
                        <article
                            id="contact-information-panel"
                            className="contact-panel contact-information-panel"
                        >
                            <h1
                                id="contact-information-title"
                                className="contact-panel-title"
                            >
                                Contact us
                            </h1>

                            <p
                                id="contact-information-description"
                                className="contact-information-description"
                            >
                                If you have any questions about the program,
                                feel free to contact us through email, phone,
                                or send us a message through the form.
                            </p>

                            <address
                                id="contact-details"
                                className="contact-details"
                            >
                                <div
                                    id="contact-email-detail"
                                    className="contact-detail"
                                >
                                    <img
                                        id="contact-email-icon"
                                        className="contact-detail-icon"
                                        src={emailIcon}
                                        alt=""
                                        aria-hidden="true"
                                    />

                                    <div
                                        id="contact-email-content"
                                        className="contact-detail-content"
                                    >
                                        <a
                                            id="contact-email-link"
                                            className="contact-detail-link"
                                            href="mailto:enkku123@kku.ac.th"
                                        >
                                            enkkud23@kku.ac.th
                                        </a>
                                    </div>
                                </div>

                                <div
                                    id="contact-phone-detail"
                                    className="contact-detail"
                                >
                                    <img
                                        id="contact-phone-icon"
                                        className="contact-detail-icon"
                                        src={emailIcon}
                                        alt=""
                                        aria-hidden="true"
                                    />

                                    <div
                                        id="contact-phone-content"
                                        className="contact-detail-content"
                                    >
                                        <a
                                            id="contact-phone-link"
                                            className="contact-detail-link"
                                            href="tel:+661234567890"
                                        >
                                            123-456-7890 (ENKKU office)
                                        </a>
                                    </div>
                                </div>

                                <div
                                    id="contact-location-detail"
                                    className="contact-detail"
                                >
                                    <img
                                        id="contact-location-icon"
                                        className="contact-detail-icon contact-location-icon"
                                        src={locationIcon}
                                        alt=""
                                        aria-hidden="true"
                                    />

                                    <div
                                        id="contact-location-content"
                                        className="contact-detail-content"
                                    >
                                        <p
                                            id="contact-location-address"
                                            className="contact-detail-text"
                                        >
                                            Department of Computer Engineering,<br />Faculty of Engineering, Khon Kaen
                                            University<br />123 Mittraphap Road, Muang, Khon Kaen 40002
                                        </p>
                                    </div>
                                </div>

                                <div
                                    id="contact-hours-detail"
                                    className="contact-detail"
                                >
                                    <img
                                        id="contact-clock-icon"
                                        className="contact-detail-icon"
                                        src={clockIcon}
                                        alt=""
                                        aria-hidden="true"
                                    />

                                    <div
                                        id="contact-hours-content"
                                        className="contact-detail-content"
                                    >
                                        <p
                                            id="contact-hours-text"
                                            className="contact-detail-text"
                                        >
                                            Available office hours
                                            <br />
                                            09:00–16:00
                                        </p>
                                    </div>
                                </div>

                                <div
                                    id="contact-facebook-detail"
                                    className="contact-detail"
                                >
                                    <img
                                        id="contact-facebook-icon"
                                        className="contact-detail-icon"
                                        src={facebookIcon}
                                        alt=""
                                        aria-hidden="true"
                                    />

                                    <div
                                        id="contact-facebook-content"
                                        className="contact-detail-content"
                                    >
                                        <a
                                            id="contact-facebook-link"
                                            className="contact-detail-link"
                                            href="https://www.facebook.com/DMEKKU"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Digital Media Engineering KKU
                                        </a>
                                    </div>
                                </div>

                                <div
                                    id="contact-website-detail"
                                    className="contact-detail"
                                >
                                    <img
                                        id="contact-link-icon"
                                        className="contact-detail-icon"
                                        src={linkIcon}
                                        alt=""
                                        aria-hidden="true"
                                    />

                                    <div
                                        id="contact-website-content"
                                        className="contact-detail-content"
                                    >
                                        <a
                                            id="contact-website-link"
                                            className="contact-detail-link"
                                            href="https://www.en.kku.ac.th/"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            en.kku.ac.th
                                        </a>
                                    </div>
                                </div>
                            </address>
                        </article>

                        <article
                            id="contact-form-panel"
                            className="contact-panel contact-form-panel"
                        >
                            <h2
                                id="contact-form-title"
                                className="contact-panel-title"
                            >
                                Send us forms
                            </h2>

                            <form
                                id="contact-form"
                                className="contact-form"
                                onSubmit={HandleContactSubmit}
                            >
                                <div
                                    id="contact-firstname-field"
                                    className="contact-form-field"
                                >
                                    <label
                                        id="contact-firstname-label"
                                        className="contact-form-label"
                                        htmlFor="contact-firstname-input"
                                    >
                                        Firstname:
                                    </label>

                                    <input
                                        id="contact-firstname-input"
                                        className="contact-form-input"
                                        type="text"
                                        name="firstName"
                                        value={contactForm.firstName}
                                        onChange={HandleContactInput}
                                        autoComplete="given-name"
                                        required
                                    />
                                </div>

                                <div
                                    id="contact-lastname-field"
                                    className="contact-form-field"
                                >
                                    <label
                                        id="contact-lastname-label"
                                        className="contact-form-label"
                                        htmlFor="contact-lastname-input"
                                    >
                                        Lastname:
                                    </label>

                                    <input
                                        id="contact-lastname-input"
                                        className="contact-form-input"
                                        type="text"
                                        name="lastName"
                                        value={contactForm.lastName}
                                        onChange={HandleContactInput}
                                        autoComplete="family-name"
                                        required
                                    />
                                </div>

                                <div
                                    id="contact-email-field"
                                    className="contact-form-field"
                                >
                                    <label
                                        id="contact-email-label"
                                        className="contact-form-label"
                                        htmlFor="contact-email-input"
                                    >
                                        Email:
                                    </label>

                                    <input
                                        id="contact-email-input"
                                        className="contact-form-input"
                                        type="email"
                                        name="email"
                                        value={contactForm.email}
                                        onChange={HandleContactInput}
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <div
                                    id="contact-topic-field"
                                    className="contact-form-field contact-topic-field"
                                >
                                    <label
                                        id="contact-topic-label"
                                        className="contact-form-label"
                                        htmlFor="contact-topic-input"
                                    >
                                        Topics:
                                    </label>

                                    <input
                                        id="contact-topic-input"
                                        className="contact-form-input"
                                        type="text"
                                        name="topic"
                                        value={contactForm.topic}
                                        onChange={HandleContactInput}
                                        required
                                    />
                                </div>

                                <div
                                    id="contact-message-field"
                                    className="contact-message-field"
                                >
                                    <label
                                        id="contact-message-label"
                                        className="contact-form-label contact-message-label"
                                        htmlFor="contact-message-input"
                                    >
                                        Messages about:
                                    </label>

                                    <div
                                        id="contact-message-controls"
                                        className="contact-message-controls"
                                    >
                                        <textarea
                                            id="contact-message-input"
                                            className="contact-message-input"
                                            name="message"
                                            value={contactForm.message}
                                            onChange={HandleContactInput}
                                            required
                                        />

                                        <button
                                            id="contact-submit-button"
                                            className="contact-submit-button"
                                            type="submit"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </article>

                        <article
                            id="contact-chatbot-panel"
                            className="contact-panel contact-chatbot-panel"
                        >
                            <h2
                                id="contact-chatbot-title"
                                className="contact-panel-title"
                            >
                                Ask AI chatbot
                            </h2>

                            <div
                                id="contact-chatbot-messages"
                                className="contact-chatbot-messages"
                                aria-live="polite"
                            >
                                {chatMessages.map(chat => (
                                    <div
                                        id={`contact-chat-message-${chat.id}`}
                                        className={
                                            chat.sender === "bot"
                                                ? "contact-chat-message contact-bot-message"
                                                : "contact-chat-message contact-user-message"
                                        }
                                        key={chat.id}
                                    >
                                        {chat.sender === "bot" && (
                                            <img
                                                id={`contact-chat-avatar-${chat.id}`}
                                                className="contact-chatbot-avatar"
                                                src={chatbotIcon}
                                                alt="DME chatbot"
                                            />
                                        )}

                                        <div
                                            id={`contact-chat-content-${chat.id}`}
                                            className="contact-chat-content"
                                        >
                                            <span
                                                id={`contact-chat-name-${chat.id}`}
                                                className="contact-chat-name"
                                            >
                                                {chat.sender === "bot"? "DME BOT" : ""}
                                            </span>

                                            <p
                                                id={`contact-chat-text-${chat.id}`}
                                                className="contact-chat-text"
                                            >
                                                {chat.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form
                                id="contact-chatbot-form"
                                className="contact-chatbot-form"
                                onSubmit={HandleChatSubmit}
                            >
                                <label
                                    id="contact-chat-input-label"
                                    className="contact-hidden-label"
                                    htmlFor="contact-chat-input"
                                >
                                    Type your message
                                </label>

                                <input
                                    id="contact-chat-input"
                                    className="contact-chat-input"
                                    type="text"
                                    value={chatInput}
                                    onChange={event =>
                                        setChatInput(event.target.value)
                                    }
                                    placeholder="Type your message here..."
                                />

                                <button
                                    id="contact-chat-submit-button"
                                    className="contact-chat-submit-button"
                                    type="submit"
                                    aria-label="Send message"
                                >
                                    <span
                                        id="contact-chat-submit-arrow"
                                        className="contact-chat-submit-arrow"
                                        aria-hidden="true"
                                    >
                                        ➤
                                    </span>
                                </button>
                            </form>
                        </article>
                    </div>
                </section>
            </main>
        </Fragment>
    )
}