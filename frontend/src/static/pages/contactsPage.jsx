import { Fragment, useState, useEffect, useRef } from "react";
import { NavigationBar } from "./components/navBar";
import { ContactMap } from "./components/DME_map";
import "../css_styles/css_pages/contact_faq.css";
import clockIcon from "../../assets/icons/clock_icon.png";
import emailIcon from "../../assets/icons/email_icon.png";
import facebookIcon from "../../assets/icons/facebook_icon.png";
import linkIcon from "../../assets/icons/link_icon.png";
import locationIcon from "../../assets/icons/location_icon.png";
import chatbotIcon from "../../assets/icons/chatbot_icon.png";
import responseChatIcon from "../../assets/icons/chat_icon.png";

const CHAT_API = "/api/contacts/chat";

export function ContactFaq() {
    const [contactForm, setContactForm] = useState({firstName: "",lastName: "",email: "", topic: "",message: ""});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [formStatus, setFormStatus] = useState({ type: "", message: "" });
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState("");
    const chatBusy = useRef(false);
    const chatMessagesRef = useRef(null);
    const nextChatId = useRef(1);

    const [chatMessages, setChatMessages] = useState([
        {
            id: 1,
            sender: "bot",
            text: "Hello, how can I help you?"
        }
    ]);

    useEffect(() => {
        const panel = chatMessagesRef.current;
        if (panel) panel.scrollTop = panel.scrollHeight;
    }, [chatMessages, isChatLoading]);

    const [currentUser, setCurrentUser] = useState(null);
    const [showAdminForms, setShowAdminForms] = useState(false);
    const [adminForms, setAdminForms] = useState([]);
    const [selectedAdminForm, setSelectedAdminForm] = useState(null);
    const [selectedFormIds, setSelectedFormIds] = useState([]);
    const [adminResponse, setAdminResponse] = useState("");
    const [showUserResponses, setShowUserResponses] = useState(false);
    const [userResponses, setUserResponses] = useState([]);
    const [unreadResponseCount, setUnreadResponseCount] = useState(0);
    const isAdmin = currentUser?.username === "admin";

    useEffect(() => {
        if (!showAdminForms && !showUserResponses) {
            return;
        }
        
        const popup = document.getElementById(showAdminForms ? "admin-contact-popup" : "user-response-popup");

        if (!popup) {
            return;
        }

        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        popup.querySelector("button")?.focus();

        function HandleDialogKey(event) {
            if (event.key === "Escape") {
                setShowAdminForms(false);
                setShowUserResponses(false);
            }

            if (event.key !== "Tab") return;
            const controls = popup.querySelectorAll(
                'button:not(:disabled), input:not(:disabled), textarea:not(:disabled)'
            );

            const first = controls[0];
            const last = controls[controls.length - 1];
            
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } 

            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        }
        document.addEventListener("keydown", HandleDialogKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", HandleDialogKey);
            previousFocus?.focus();
        };
        
    }, [showAdminForms, showUserResponses]);

    useEffect(() => {
        async function GetSession() {
            try {
                const response = await fetch("/api/session",
                    {
                        credentials: "include"
                    }
                );

                if (!response.ok) {
                    setCurrentUser(null);
                    return;
                }

                const result = await response.json();

                setCurrentUser(result.user || null);
            } 
            catch (error) {
                console.error(
                    "Get session error:",
                    error
                );

                setCurrentUser(null);
            } 
            finally {
                setIsSessionLoading(false);
            }
        }

        GetSession();
    }, []);

    useEffect(() => {
        if (!currentUser?.id || isAdmin) {
            setUnreadResponseCount(0);
            return undefined;
        }

        let isActive = true;

        async function GetUnreadCount() {
            try {
                const response = await fetch(
                    "/api/contacts/responses/unread-count",
                    {
                        credentials: "include"
                    }
                );

                const result = await response.json();

                if (
                    isActive &&
                    response.ok &&
                    result.success
                ) {
                    setUnreadResponseCount(
                        result.count || 0
                    );
                }
            } 
            catch (error) {
                console.error(
                    "Get unread response count error:",
                    error
                );
            }
        }

        GetUnreadCount();

        const intervalId = window.setInterval(
            GetUnreadCount,
            15000
        );

        return () => {
            isActive = false;

            window.clearInterval(intervalId);
        };
    }, [currentUser?.id, isAdmin]);

    async function OpenAdminForms() {
        try {
            const response = await fetch(
                "/api/admin/contacts",
                {
                    credentials: "include"
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Cannot retrieve submitted forms."
                );
            }

            setAdminForms(result.contacts || []);

            setSelectedAdminForm(null);

            setSelectedFormIds([]);

            setShowAdminForms(true);
        } 
        catch (error) {
            alert(
                error.message ||
                "Cannot retrieve submitted forms."
            );
        }
    }

    async function SendAdminResponse(event) {
        event.preventDefault();

        if (!selectedAdminForm || !adminResponse.trim()) {
            return;
        }

        try {
            const response = await fetch(
                `/api/admin/contacts/${selectedAdminForm.form_id}/reply`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        response: adminResponse.trim()
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Cannot save the response."
                );
            }

            setAdminForms(previousForms =>
                previousForms.map(form =>
                    form.form_id === result.contact.form_id ? result.contact : form
                )
            );

            setSelectedAdminForm(result.contact);

            setAdminResponse("");

            alert(result.message);
        } 
        catch (error) {
            alert(error.message || "Cannot save the response.");
        }
    }

    async function DeleteSelectedForms() {
        if (selectedFormIds.length === 0) {
            alert("Select at least one form to delete.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete ${selectedFormIds.length} form(s)?`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                "/api/admin/contacts",
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        formIds: selectedFormIds
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Cannot delete the selected forms."
                );
            }

            const deletedIds = result.deletedIds.map(
                id => String(id)
            );

            setAdminForms(previousForms =>
                previousForms.filter(
                    form =>
                        !deletedIds.includes(
                            String(form.form_id)
                        )
                )
            );

            if (
                selectedAdminForm &&
                deletedIds.includes(
                    String(selectedAdminForm.form_id)
                )
            ) {
                setSelectedAdminForm(null);
                setAdminResponse("");
            }

            setSelectedFormIds([]);

            alert(result.message);
        } catch (error) {
            alert(
                error.message ||
                "Cannot delete the selected forms."
            );
        }
    }

    function ToggleSelectedForm(formId) {
        const stringFormId = String(formId);

        setSelectedFormIds(previousIds => {
            if (previousIds.includes(stringFormId)) {
                return previousIds.filter(
                    id => id !== stringFormId
                );
            }

            return [
                ...previousIds,
                stringFormId
            ];
        });
    }

    function SelectAdminForm(form) {
        setSelectedAdminForm(form);

        setAdminResponse(
            form.admin_response || ""
        );
    }

    async function OpenUserResponses() {
        try {
            const response = await fetch(
                "/api/contacts/responses",
                {
                    credentials: "include"
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Cannot retrieve your responses."
                );
            }

            setUserResponses(result.responses || []);

            setShowUserResponses(true);

            const unreadResponses =
                (result.responses || []).filter(
                    item => !item.response_read
                );

            await Promise.all(
                unreadResponses.map(item =>
                    fetch(
                        `/api/contacts/responses/${item.form_id}/read`,
                        {
                            method: "PATCH",
                            credentials: "include"
                        }
                    )
                )
            );

            setUnreadResponseCount(0);
        } catch (error) {
            alert(
                error.message ||
                "Cannot retrieve your responses."
            );
        }
    }

    function HandleContactInput(event) {
        const { name, value } = event.target;

        setContactForm(previousForm => ({
            ...previousForm,
            [name]: value
        }));
    }

    async function HandleContactSubmit(event) {
        event.preventDefault();

        if (isSubmitting || isSessionLoading) {
            return;
        }

        if (!currentUser?.id) {
            setFormStatus({
                type: "error",
                message: "Please log in before submitting a contact form."
            });
            return;
        }

        setIsSubmitting(true);

        setFormStatus({
            type: "",
            message: ""
        });

        try {
            const response = await fetch(
                "/api/contacts",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        firstName: contactForm.firstName,
                        lastName: contactForm.lastName,
                        email: contactForm.email,
                        topics: contactForm.topic,
                        message_about: contactForm.message
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Cannot submit your message."
                );
            }

            setFormStatus({
                type: "success",
                message: result.message
            });

            setContactForm({
                firstName: "",
                lastName: "",
                email: "",
                topic: "",
                message: ""
            });
        } catch (error) {
            console.error(
                "Contact form submission error:",
                error
            );

            setFormStatus({
                type: "error",
                message:
                    error.message ||
                    "Cannot submit the message."
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    {/*The chatbot section when submitting ask AI part, this part, the Gemini AI will answer the question */}
    async function HandleChatSubmit(event) {
        event.preventDefault();
        const message = chatInput.trim();
        if (!message || chatBusy.current) {
            return;
        }
        if (message.length > 2000) {
            setChatError("Please keep your message under 2000 characters.");
            return;
        }

        chatBusy.current = true;
        setIsChatLoading(true);
        setChatError("");
        
        const history = chatMessages.filter(chat => chat.id !== 1).slice(-12).map(chat => ({role: chat.sender === "bot" ? "model" : "user", text: chat.text}));
        const messageId = ++nextChatId.current;
        
        setChatMessages(previousMessages => [...previousMessages, {id: messageId, sender: "user", text: message}]);
        setChatInput("");
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 50000);
        try {
            const response = await fetch(CHAT_API, {
                method: "POST", credentials: "include", 
                headers: {"Content-Type": "application/json"},
                signal: controller.signal,
                body: JSON.stringify({message, history})
            });
            
            const result = await response.json();

            if (!response.ok || !result.success || typeof result.reply !== "string" || !result.reply.trim()) {
                throw new Error(result.message || "Cannot get a chatbot answer.");
            }
            const replyId = ++nextChatId.current;
            setChatMessages(previousMessages => [...previousMessages, {id: replyId, sender: "bot", text: result.reply}]);
        } 
        catch (error) {
            setChatError(error.name === "AbortError" ? "DME BOT took too long. Please try again." : error.message || "Cannot connect to the chatbot. Please try again.");
            setChatInput(message);
            setChatMessages(previousMessages => previousMessages.filter(chat => chat.id !== messageId));
        } 
        finally {
            clearTimeout(timeout);
            chatBusy.current = false;
            setIsChatLoading(false);
        }
    }

    return (
        <Fragment>
            <NavigationBar />

            <main
                id="contact-faq-page"
                className="contact-faq-page"
            >
                <ContactMap />

                {isAdmin && (
                    <section
                        id="admin-contact-toolbar"
                        className="admin-contact-toolbar"
                    >
                        <button
                            id="admin-contact-manager-button"
                            className="admin-contact-manager-button"
                            type="button"
                            onClick={OpenAdminForms}
                        >
                            Manage submitted forms
                        </button>
                    </section>
                )}

                <section
                    id="contact-main-section"
                    className="contact-main-section"
                >
                    <div
                        id="contact-panels-container"
                        className="contact-panels-container"
                    >
                        {/* Contact information */}

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
                                If you have any questions about the
                                program, feel free to contact us through
                                email, phone, or send us a message through
                                the form.
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
                                            href="mailto:enkkud23@kku.ac.th"
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
                                            Department of Computer
                                            Engineering,
                                            <br />

                                            Faculty of Engineering,
                                            Khon Kaen University
                                            <br />

                                            123 Mittraphap Road, Muang,
                                            Khon Kaen 40002
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

                        {/* Contact form */}

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

                            <p
                                id="contact-form-description"
                                className="contact-form-description"
                            >
                                Response will appear in notification
                            </p>

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
                                        maxLength={20}
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
                                        maxLength={20}
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
                                        maxLength={100}
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
                                        maxLength={100}
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
                                            maxLength={1000}
                                            required
                                        />

                                        <button
                                            id="contact-submit-button"
                                            className="contact-submit-button"
                                            type="submit"
                                            disabled={isSubmitting || isSessionLoading}
                                        >
                                            {isSubmitting ? "Sending..." : "Submit"}
                                        </button>
                                    </div>

                                    {formStatus.message && (
                                        <p
                                            id="contact-form-status"
                                            className={formStatus.type === "success" ? "contact-form-status contact-form-success" : "contact-form-status contact-form-error"}
                                            role={formStatus.type === "error" ? "alert" : "status"}
                                        >
                                            {formStatus.message}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </article>

                        {/* Chatbot */}

                        <article  id="contact-chatbot-panel" className="contact-panel contact-chatbot-panel">
                            <h2 id="contact-chatbot-title" className="contact-panel-title">
                                Ask AI chatbot
                            </h2>

                            <div
                                ref={chatMessagesRef}
                                id="contact-chatbot-messages"
                                className="contact-chatbot-messages"
                                aria-live="polite"
                            >
                                {chatMessages.map(chat => (
                                    <div
                                        id={`contact-chat-message-${chat.id}`}
                                        className={chat.sender === "bot" ? "contact-chat-message contact-bot-message" : "contact-chat-message contact-user-message"}
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
                                            <span id={`contact-chat-name-${chat.id}`} className="contact-chat-name">
                                                {chat.sender === "bot" ? "DME BOT": ""}
                                            </span>

                                            <p id={`contact-chat-text-${chat.id}`} className="contact-chat-text">
                                                {chat.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isChatLoading && <p className="contact-chat-status" role="status">DME BOT is answering... </p>}
                            {chatError && <p className="contact-chat-error" role="alert">{chatError}</p>}
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
                                    disabled={isChatLoading}
                                    maxLength={2000}
                                    id="contact-chat-input"
                                    className="contact-chat-input"
                                    type="text"
                                    value={chatInput}
                                    onChange={event =>
                                        setChatInput(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Type your message here..."
                                />

                                <button
                                    disabled={isChatLoading || !chatInput.trim()}
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

                {currentUser && !isAdmin && (
                    <button
                        id="contact-response-notification"
                        className="contact-response-notification"
                        type="button"
                        onClick={OpenUserResponses}
                        aria-label={`Open contact responses. ${unreadResponseCount} unread messages.`}
                    >
                        <img id="contact-response-chat-icon"
                            className="contact-response-chat-icon"
                            src={responseChatIcon}
                            aria-hidden="true"
                        />

                        {unreadResponseCount > 0 && (
                            <span
                                id="contact-response-badge"
                                className="contact-response-badge"
                            >
                                {unreadResponseCount > 99 ? "99+" : unreadResponseCount}
                            </span>
                        )}
                    </button>
                )}

                {showAdminForms && isAdmin && (
                    <div
                        id="admin-contact-popup-overlay"
                        className="admin-contact-popup-overlay"
                    >
                        <section
                            id="admin-contact-popup"
                            className="admin-contact-popup"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="admin-contact-popup-title"
                        >
                            <header
                                id="admin-contact-popup-header"
                                className="admin-contact-popup-header"
                            >
                                <h2
                                    id="admin-contact-popup-title"
                                    className="admin-contact-popup-title"
                                >
                                    Submitted forms
                                </h2>

                                <button
                                    id="admin-contact-popup-close"
                                    aria-label="Close submitted forms"
                                    className="admin-contact-popup-close"
                                    type="button"
                                    onClick={() =>
                                        setShowAdminForms(false)
                                    }
                                >
                                    x
                                </button>
                            </header>

                            <div
                                id="admin-contact-popup-content"
                                className="admin-contact-popup-content"
                            >
                                <aside
                                    id="admin-contact-form-list"
                                    className="admin-contact-form-list"
                                >
                                    {adminForms.length === 0 && (
                                        <p
                                            id="admin-contact-empty"
                                            className="admin-contact-empty"
                                        >
                                            No submitted forms.
                                        </p>
                                    )}

                                    {adminForms.map(form => (
                                        <div
                                            id={`admin-contact-item-${form.form_id}`}
                                            className={
                                                selectedAdminForm?.form_id ===
                                                    form.form_id
                                                    ? "admin-contact-item admin-contact-item-selected"
                                                    : "admin-contact-item"
                                            }
                                            key={form.form_id}
                                        >
                                            <input
                                                id={`admin-contact-checkbox-${form.form_id}`}
                                                className="admin-contact-checkbox"
                                                aria-label={`Select form: ${form.topics}`}
                                                type="checkbox"
                                                checked={selectedFormIds.includes(
                                                    String(form.form_id)
                                                )}
                                                onChange={() =>
                                                    ToggleSelectedForm(
                                                        form.form_id
                                                    )
                                                }
                                            />

                                            <button
                                                id={`admin-contact-select-${form.form_id}`}
                                                className="admin-contact-select"
                                                type="button"
                                                onClick={() =>
                                                    SelectAdminForm(form)
                                                }
                                            >
                                                <strong
                                                    className="admin-contact-topic"
                                                >
                                                    {form.topics}
                                                </strong>

                                                <span
                                                    className="admin-contact-sender"
                                                >
                                                    {form.firstName}{" "}
                                                    {form.lastName}
                                                </span>

                                                <span
                                                    className="admin-contact-state"
                                                    data-status={form.response_status}
                                                >
                                                    {form.response_status}
                                                </span>
                                            </button>
                                        </div>
                                    ))}
                                </aside>

                                <div
                                    id="admin-contact-response-section"
                                    className="admin-contact-response-section"
                                >
                                    {!selectedAdminForm && (
                                        <p
                                            id="admin-contact-select-message"
                                            className="admin-contact-select-message"
                                        >
                                            Select a form to view it.
                                        </p>
                                    )}

                                    {selectedAdminForm && (
                                        <Fragment>
                                            <h3
                                                id="admin-selected-topic"
                                                className="admin-selected-topic"
                                            >
                                                {selectedAdminForm.topics}
                                            </h3>

                                            <p
                                                id="admin-selected-user"
                                                className="admin-selected-user"
                                            >
                                                {selectedAdminForm.firstName}{" "}{selectedAdminForm.lastName}
                                            </p>

                                            <p
                                                id="admin-selected-message"
                                                className="admin-selected-message"
                                            >
                                                {selectedAdminForm.message_about}
                                            </p>

                                            <form
                                                id="admin-response-form"
                                                className="admin-response-form"
                                                onSubmit={SendAdminResponse}
                                            >
                                                <label
                                                    id="admin-response-label"
                                                    className="admin-response-label"
                                                    htmlFor="admin-response-input"
                                                >
                                                    Admin response
                                                </label>

                                                <textarea
                                                    id="admin-response-input"
                                                    className="admin-response-input"
                                                    value={adminResponse}
                                                    onChange={event => setAdminResponse(event.target.value)}
                                                    maxLength={5000}
                                                    required
                                                />

                                                <button
                                                    id="admin-response-submit"
                                                    className="admin-response-submit"
                                                    type="submit"
                                                >
                                                    Save response
                                                </button>
                                            </form>
                                        </Fragment>
                                    )}
                                </div>
                            </div>

                            <footer
                                id="admin-contact-popup-footer"
                                className="admin-contact-popup-footer"
                            >
                                <button
                                    id="admin-delete-forms-button"
                                    className="admin-delete-forms-button"
                                    type="button"
                                    onClick={DeleteSelectedForms}
                                    disabled={
                                        selectedFormIds.length === 0
                                    }
                                >
                                    Delete selected (
                                    {selectedFormIds.length})
                                </button>
                            </footer>
                        </section>
                    </div>
                )}

                {showUserResponses && !isAdmin && (
                    <div
                        id="user-response-popup-overlay"
                        className="user-response-popup-overlay"
                    >
                        <section
                            id="user-response-popup"
                            className="user-response-popup"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="user-response-popup-title"
                        >
                            <header
                                id="user-response-popup-header"
                                className="user-response-popup-header"
                            >
                                <h2
                                    id="user-response-popup-title"
                                    className="user-response-popup-title"
                                >
                                    Your responses
                                </h2>

                                <button
                                    id="user-response-popup-close"
                                    aria-label="Close your responses"
                                    className="user-response-popup-close"
                                    type="button"
                                    onClick={() =>
                                        setShowUserResponses(false)
                                    }
                                >
                                    x
                                </button>
                            </header>

                            <div
                                id="user-response-list"
                                className="user-response-list"
                            >
                                {userResponses.length === 0 && (
                                    <p
                                        id="user-response-empty"
                                        className="user-response-empty"
                                    >
                                        You have no responses yet.
                                    </p>
                                )}

                                {userResponses.map(response => (
                                    <article
                                        id={`user-response-${response.form_id}`}
                                        className="user-response-card"
                                        key={response.form_id}
                                    >
                                        <h3
                                            className="user-response-topic"
                                        >
                                            {response.topics}
                                        </h3>

                                        <div
                                            className="user-response-question"
                                        >
                                            <strong>
                                                Your question
                                            </strong>

                                            <p>
                                                {
                                                    response.message_about
                                                }
                                            </p>
                                        </div>

                                        <div
                                            className="user-response-answer"
                                        >
                                            <strong>
                                                Admin response
                                            </strong>

                                            <p>
                                                {
                                                    response.admin_response
                                                }
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </Fragment>
    );
}
