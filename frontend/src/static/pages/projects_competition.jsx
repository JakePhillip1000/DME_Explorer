import {useCallback, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {NavigationBar} from "./components/navBar";
import DMELogo from "../../assets/icons/DME_logo1.png";
import ProjectBanner from "../../assets/images/ENKKU_50year.png";
import "../../static/css_styles/css_pages/projects_page.css";

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "").replace(/\/$/, "");
const PROJECT_API = `${API_ORIGIN}/api/projects`;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

async function Request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: "include"
    });

    const result = await response.json().catch(() => {
        throw new Error("Cannot reach the project service. Check that the backend is running.");
    });

    if (!response.ok || !result.success) {
        throw new Error(result.message || "The request failed.");
    }

    return result;
}

function Today() {
    const date = new Date();

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function ProjectModal({children, onClose, labelledBy, large = false, className = ""}) {
    const dialog = useRef(null);
    const closeRef = useRef(onClose);

    closeRef.current = onClose;

    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";
        dialog.current.focus();

        function HandleKey(event) {
            if (event.key === "Escape") {
                closeRef.current();
            }

            if (event.key !== "Tab") return;

            const elements = [
                ...dialog.current.querySelectorAll(
                    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
                )
            ];

            const first = elements[0];
            const last = elements[elements.length - 1];

            if (!first) {
                event.preventDefault();
                return;
            }

            if (event.shiftKey && (
                document.activeElement === first ||
                document.activeElement === dialog.current
            )) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (
                document.activeElement === last ||
                document.activeElement === dialog.current
            )) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", HandleKey);

        return () => {
            document.removeEventListener("keydown", HandleKey);
            document.body.style.overflow = previousOverflow;

            if (previousFocus?.isConnected) {
                previousFocus.focus();
            }
        };
    }, []);

    return createPortal(
        <div className="projects-modal-backdrop" onMouseDown={event => {
            if (event.target === event.currentTarget) {
                closeRef.current();
            }
        }}>
            <section
                className={`projects-modal ${large ? "projects-modal-large" : ""} ${className}`}
                ref={dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                tabIndex={-1}
            >
                {children}
            </section>
        </div>,
        document.body
    );
}

function ProjectForm({project, categories, onClose, onSaved}) {
    const editing = Boolean(project);

    const [form, SetForm] = useState({
        project_title: project?.project_title || "",
        category: project?.category || categories[0] || "",
        published_date: project?.published_date || Today(),
        priority: String(project?.priority || 1),
        project_content: project?.project_content || ""
    });

    const [file, SetFile] = useState(null);
    const [preview, SetPreview] = useState(project?.project_image || "");
    const [removeImage, SetRemoveImage] = useState(false);
    const [saving, SetSaving] = useState(false);
    const [error, SetError] = useState("");
    const [logoError, SetLogoError] = useState(false);

    const fileInput = useRef(null);

    useEffect(() => {
        if (!file) {
            SetPreview(removeImage ? "" : project?.project_image || "");
            return;
        }

        const url = URL.createObjectURL(file);

        SetPreview(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file, removeImage, project]);

    function ChangeField(event) {
        SetForm(previous => ({
            ...previous,
            [event.target.name]: event.target.value
        }));
    }

    function ChooseImage(event) {
        const image = event.target.files[0];

        if (!image) {
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

        if (image.size > MAX_IMAGE_SIZE || !allowedTypes.includes(image.type)) {
            SetError("The file cannot be this large or unsupported format");
            event.target.value = "";
            return;
        }

        SetError("");
        SetRemoveImage(false);
        SetFile(image);
    }

    function RemoveImage() {
        SetFile(null);
        SetRemoveImage(true);

        if (fileInput.current) {
            fileInput.current.value = "";
        }
    }

    async function SaveProject(event) {
        event.preventDefault();

        if (saving) return;

        SetSaving(true);
        SetError("");

        try {
            const body = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                body.append(key, value);
            });

            if (file) {
                body.append("project_image_file", file);
            }

            if (removeImage) {
                body.append("remove_image", "true");
            }

            const url = editing ? `${PROJECT_API}/${project.project_id}` : PROJECT_API;

            let requestMethod;
            if (editing) {
                requestMethod = "PUT";
            }
            else {
                requestMethod = "POST";
            }

            const result = await Request(url, {
                method: requestMethod,
                body
            });

            onSaved(result.message);
        } 
        catch (error) {
            SetError(error.message);
        } 
        finally {
            SetSaving(false);
        }
    }

    return (
        <ProjectModal onClose={() => {
            if (!saving) {
                onClose();
            }
            
        }} labelledBy="project-form-heading" className="projects-form-modal">
            <header className="projects-form-header">
                <div className="projects-form-brand">
                    {!logoError ? (
                        <img
                            className="projects-form-logo"
                            src={DMELogo}
                            alt="Digital Media Engineering, Khon Kaen University"
                            onError={() => SetLogoError(true)}
                        />
                    ) : (
                        <span className="projects-brand-text">
                            DIGITAL MEDIA
                            <br className="projects-brand-break"/>
                            ENGINEERING
                            <br className="projects-brand-break"/>
                            KHON KAEN UNIVERSITY
                        </span>
                    )}
                </div>

                <h2 className="projects-form-heading" id="project-form-heading">
                    {editing ? "Edit DME Project" : "Add DME Project"}
                </h2>

                <span className="projects-admin-note">(for admin only)</span>
            </header>

            <form className="projects-form" onSubmit={SaveProject}>
                <fieldset className="projects-form-fields" disabled={saving}>
                    <div className="projects-form-row">
                        <label className="projects-field-label" htmlFor="project-title">Project Title:</label>
                        <input className="projects-field" id="project-title" name="project_title" value={form.project_title} onChange={ChangeField} maxLength={160} required/>
                    </div>

                    <div className="projects-form-row">
                        <label className="projects-field-label" htmlFor="project-category">Category:</label>

                        <select className="projects-field" id="project-category" name="category" value={form.category} onChange={ChangeField} required>
                            {categories.map(category => (
                                <option className="projects-option" key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    <div className="projects-form-row">
                        <label className="projects-field-label" htmlFor="project-date">Publish Date:</label>
                        <input className="projects-field" id="project-date" type="date" name="published_date" value={form.published_date} onChange={ChangeField} required/>
                    </div>

                    <div className="projects-form-row">
                        <label className="projects-field-label" htmlFor="project-image">Project image:</label>

                        <div className="projects-image-input-group">
                            <input
                                className="projects-field projects-file-input"
                                id="project-image"
                                ref={fileInput}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={ChooseImage}
                            />

                            <span className="projects-field-help">Optional · maximum 2 MB</span>

                            {preview && (
                                <div className="projects-preview-group">
                                    <img className="projects-image-preview" src={preview} alt="Project preview"/>
                                    <button className="projects-remove-image" type="button" onClick={RemoveImage}>Remove image</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="projects-form-row">
                        <span className="projects-field-label" id="project-priority-label">Priority:</span>

                        <div className="projects-priorities" role="group" aria-labelledby="project-priority-label">
                            {[
                                {value: "3", label: "High"},
                                {value: "2", label: "Medium"},
                                {value: "1", label: "Low"}
                            ].map(item => (
                                <label className="projects-radio-label" key={item.value}>
                                    <input className="projects-radio" type="radio" name="priority" value={item.value} checked={form.priority === item.value} onChange={ChangeField}/>
                                    {item.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="projects-form-row projects-content-row">
                        <label className="projects-field-label" htmlFor="project-content">Project contents:</label>
                        <textarea className="projects-field projects-textarea" id="project-content" name="project_content" value={form.project_content} onChange={ChangeField} maxLength={20000} required/>
                    </div>
                </fieldset>

                {error && <p className="projects-error" role="alert">{error}</p>}

                <footer className="projects-form-footer">
                    <button className="projects-quit-button" type="button" disabled={saving} onClick={onClose}>Quit</button>
                    <button className="projects-save-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save & Quit"}</button>
                </footer>
            </form>
        </ProjectModal>
    );
}

export function ProjectPage() {
    const [isAdmin, SetIsAdmin] = useState(false);
    const [categories, SetCategories] = useState([]);
    const [projects, SetProjects] = useState([]);

    const [keyword, SetKeyword] = useState("");
    const [filters, SetFilters] = useState({
        search: "",
        category: "",
        page: 1
    });

    const [total, SetTotal] = useState(0);
    const [loading, SetLoading] = useState(true);
    const [error, SetError] = useState("");
    const [notice, SetNotice] = useState("");

    const [selecting, SetSelecting] = useState(false);
    const [selectedIds, SetSelectedIds] = useState([]);
    const [deleting, SetDeleting] = useState(false);

    const [detailLoading, SetDetailLoading] = useState(false);
    const [formOpen, SetFormOpen] = useState(false);
    const [editingProject, SetEditingProject] = useState(null);
    const [readingProject, SetReadingProject] = useState(null);

    const [refresh, SetRefresh] = useState(0);

    const detailRequest = useRef(0);
    const pages = Math.max(1, Math.ceil(total / 12));

    useEffect(() => {
        const controller = new AbortController();

        async function GetSession() {
            try {
                const response = await fetch(`${API_ORIGIN}/api/session`, {
                    credentials: "include",
                    signal: controller.signal
                });

                if (response.status === 401) {
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to check your session.");
                }

                const result = await response.json();

                if (!controller.signal.aborted) {
                    SetIsAdmin(result.loggedIn && result.user?.username === "admin");
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    SetError(error.message);
                }
            }
        }

        async function GetCategories() {
            try {
                const result = await Request(`${PROJECT_API}/categories`, {
                    signal: controller.signal
                });

                if (!controller.signal.aborted) {
                    SetCategories(result.categories);
                }
            } 
            catch (error) {
                if (!controller.signal.aborted) {
                    SetError(error.message);
                }
            }
        }

        GetSession();
        GetCategories();

        return () => {
            controller.abort();
            detailRequest.current++;
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        async function GetProjects() {
            SetLoading(true);
            SetError("");

            try {
                const query = new URLSearchParams({
                    search: filters.search,
                    category: filters.category,
                    page: String(filters.page)
                });

                const result = await Request(`${PROJECT_API}?${query}`, {
                    signal: controller.signal
                });

                if (controller.signal.aborted) {
                    return;
                }

                const lastPage = Math.max(1, Math.ceil(result.total / result.pageSize));

                if (filters.page > lastPage) {
                    SetFilters(previous => ({
                        ...previous,
                        page: lastPage
                    }));

                    return;
                }

                SetProjects(result.projects);
                SetTotal(result.total);
            } 
            catch (error) {
                if (!controller.signal.aborted) {
                    SetError(error.message);
                }
            } 
            finally {
                if (!controller.signal.aborted) {
                    SetLoading(false);
                }
            }
        }

        GetProjects();

        return () => {
            controller.abort();
        };
    }, [filters, refresh]);

    function SearchProjects(event) {
        event.preventDefault();

        SetSelectedIds([]);

        SetFilters(previous => ({
            ...previous,
            search: keyword.trim(),
            page: 1
        }));
    }

    function ChangeCategory(event) {
        SetSelectedIds([]);

        SetFilters({
            search: keyword.trim(),
            category: event.target.value,
            page: 1
        });
    }

    function ToggleSelection() {
        SetSelecting(previous => !previous);
        SetSelectedIds([]);
    }

    function SelectProject(id) {
        if (!isAdmin || !selecting || deleting) return;

        SetSelectedIds(previous => {
            return previous.includes(id)
                ? previous.filter(item => item !== id)
                : [...previous, id];
        });
    }

    async function DeleteProjects() {
        if (!isAdmin || !selectedIds.length || deleting) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure to delete these projects?\n${selectedIds.length} project(s) selected.`
        );

        if (!confirmed) return;

        SetDeleting(true);
        SetError("");
        SetNotice("");

        try {
            const result = await Request(PROJECT_API, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({projectIds: selectedIds})
            });

            SetNotice(result.message);
            SetSelectedIds([]);
            SetSelecting(false);
            SetRefresh(previous => previous + 1);
        } 
        catch (error) {
            SetError(error.message);
        } 
        finally {
            SetDeleting(false);
        }
    }

    async function OpenProject(id, edit = false) {
        if (edit && !isAdmin) return;

        const requestId = ++detailRequest.current;

        SetDetailLoading(true);
        SetError("");

        try {
            const result = await Request(`${PROJECT_API}/${id}`);

            if (requestId !== detailRequest.current) return;

            if (edit) {
                SetEditingProject(result.project);
                SetFormOpen(true);
            } else {
                SetReadingProject(result.project);
            }
        } 
        catch (error) {
            if (requestId === detailRequest.current) {
                SetError(error.message);
            }
        } 
        finally {
            if (requestId === detailRequest.current) {
                SetDetailLoading(false);
            }
        }
    }

    const CloseReadMore = useCallback(() => {
        SetReadingProject(null);
    }, []);

    function SavedProject(message) {
        SetFormOpen(false);
        SetEditingProject(null);
        SetSelectedIds([]);
        SetNotice(message);
        SetRefresh(previous => previous + 1);
    }

    function ChangePage(page) {
        SetSelectedIds([]);

        SetFilters(previous => ({...previous, page}));
    }

    return (
        <div className="projects-page">
            <header className="projects-navigation">
                <NavigationBar/>
            </header>

            <main className="projects-main">
                <section className="projects-banner" style={{"--projects-background-image": `url(${ProjectBanner})`}}>
                    <h1 className="projects-heading">Student Projects and Competitions</h1>
                    <p className="projects-heading-description">Digital Media Engineering at Khon Kaen University, Faculty of Engineering</p>
                </section>

                <section className="projects-body" aria-label="Student projects">
                    <div className="projects-toolbar">
                        <form className="projects-search-form" onSubmit={SearchProjects}>
                            <input
                                className="projects-search-input"
                                type="search"
                                placeholder="Search for projects or competitions:"
                                aria-label="Search for projects or competitions"
                                value={keyword}
                                maxLength={200}
                                onChange={event => SetKeyword(event.target.value)}
                            />

                            <button className="projects-search-button" type="submit">Search</button>

                            <select className="projects-category-filter" aria-label="Choose categories" value={filters.category} onChange={ChangeCategory}>
                                <option className="projects-option" value="">Choose categories</option>

                                {categories.map(category => (
                                    <option className="projects-option" key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </form>

                        {isAdmin && (
                            <div className="projects-admin-actions">
                                <button className="projects-select-button" type="button" aria-pressed={selecting} disabled={deleting} onClick={ToggleSelection}>
                                    {selecting ? "Cancel Selection" : "Select Project"}
                                </button>

                                <button className="projects-delete-button" type="button" disabled={!selectedIds.length || deleting} onClick={DeleteProjects}>
                                    {deleting ? "Deleting..." : `Delete Project${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
                                </button>

                                <button className="projects-add-button" type="button" disabled={deleting || !categories.length} onClick={() => {
                                    SetEditingProject(null);
                                    SetFormOpen(true);
                                }}>
                                    Add Project
                                </button>
                            </div>
                        )}
                    </div>

                    {error && <p className="projects-error" role="alert">{error}</p>}
                    {notice && <p className="projects-notice" role="status">{notice}</p>}

                    {selecting && (
                        <p className="projects-selection-help">
                            Click the project to select (only for admin)
                        </p>
                    )}

                    {detailLoading && <p className="projects-status" role="status">Loading project details...</p>}

                    {loading ? (
                        <p className="projects-status" role="status">Loading projects...</p>
                    ) : (
                        <div className="projects-grid">
                            {projects.map(project => (
                                <article
                                    className={`projects-card ${selectedIds.includes(project.project_id) ? "projects-card-selected" : ""} ${selecting ? "projects-card-selectable" : ""}`}
                                    key={project.project_id}
                                    onClick={() => SelectProject(project.project_id)}
                                    role={selecting ? "button" : undefined}
                                    tabIndex={selecting ? 0 : undefined}
                                    aria-pressed={selecting ? selectedIds.includes(project.project_id) : undefined}
                                    aria-label={selecting ? `Select ${project.project_title}` : undefined}
                                    onKeyDown={event => {
                                        if (selecting && event.target === event.currentTarget && ["Enter", " "].includes(event.key)) {
                                            event.preventDefault();
                                            SelectProject(project.project_id);
                                        }
                                    }}
                                >
                                    {project.project_image ? (
                                        <img className="projects-card-image" src={project.project_image} alt={project.project_title} loading="lazy"/>
                                    ) : (
                                        <div className="projects-card-placeholder"></div>
                                    )}

                                    <div className="projects-card-body">
                                        <h2 className="projects-card-title">{project.project_title}</h2>
                                        <p className="projects-card-summary">{project.project_summary}</p>

                                        <div className="projects-card-bottom">
                                            <div className="projects-card-actions" onClick={event => event.stopPropagation()}>
                                                <button className="projects-read-button" type="button" disabled={detailLoading} onClick={() => OpenProject(project.project_id)}>
                                                    Read more
                                                </button>

                                                {isAdmin && (
                                                    <button className="projects-edit-button" type="button" disabled={detailLoading || deleting || !categories.length} onClick={() => OpenProject(project.project_id, true)}>
                                                        Edit Project
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {!loading && !error && !projects.length && (
                        <p className="projects-empty">No projects match your search.</p>
                    )}

                    {!loading && pages > 1 && (
                        <nav className="projects-pagination" aria-label="Project pages">
                            <button className="projects-page-button" type="button" disabled={filters.page === 1 || deleting} onClick={() => ChangePage(filters.page - 1)}>
                                Previous
                            </button>

                            <span className="projects-page-count">Page {filters.page} of {pages}</span>

                            <button className="projects-page-button" type="button" disabled={filters.page === pages || deleting} onClick={() => ChangePage(filters.page + 1)}>
                                Next
                            </button>
                        </nav>
                    )}
                </section>
            </main>

            {formOpen && isAdmin && (
                <ProjectForm
                    project={editingProject}
                    categories={categories}
                    onClose={() => SetFormOpen(false)}
                    onSaved={SavedProject}
                />
            )}

            {readingProject && (
                <ProjectModal onClose={CloseReadMore} labelledBy="project-details-heading" large>
                    <button className="projects-detail-close" type="button" onClick={CloseReadMore}>x</button>

                    <div className="projects-detail-image">
                        {readingProject.project_image ? (
                            <img src={readingProject.project_image} alt={readingProject.project_title}/>
                        ) : (
                            <div className="projects-detail-placeholder">No project image</div>
                        )}
                    </div>

                    <div className="projects-detail-body">
                        <div className="projects-detail-meta">
                            <span className="projects-detail-category">{readingProject.category}</span>
                            <time className="projects-detail-date" dateTime={readingProject.published_date}>
                                {readingProject.published_date ? new Date(`${readingProject.published_date}T00:00:00`).toLocaleDateString("en-GB") : ""}
                            </time>
                        </div>

                        <h2 className="projects-detail-title" id="project-details-heading">
                            {readingProject.project_title}
                        </h2>

                        <p className="projects-detail-content">{readingProject.project_content}</p>
                    </div>
                </ProjectModal>
            )}
        </div>
    );
}
