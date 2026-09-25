import { Fragment, useEffect, useState } from "react";
import { NavigationBar } from "./components/navBar";
import "../css_styles/css_pages/program_education_style.css";
import ProgramBackground from "../../assets/images/Dme_learn1.png";

import { STUDY_PLAN, ELECTIVE_COURSES, CATEGORIES, PROGRAM_TOTAL_CREDITS } from "../data/curriculumData.js";
import { COURSE_DESCRIPTIONS } from "../data/courseDescriptions.js";

const RESPONSIBILITIES = [
    "Designing applications",
    "Implementing streaming technologies",
    "Developing interactive experiences",
    "Building asset management systems",
];

const COMPETENCIES = [
    "Audio / video programming",
    "Streaming protocols",
    "Interactive media development",
    "User experience design",
    "Virtual & augmented reality",
];

// Credit breakdown from the official program page (en.kku.ac.th/web/en/beng-dme)
const CREDIT_BREAKDOWN = [
    { label: "General Education", credits: 30, note: "Language 12 · Humanities/Social Sciences 6 · Math/Sciences 12" },
    { label: "Basic Engineering", credits: 15, note: "Fundamental courses" },
    { label: "Core Engineering", credits: 36, note: "Compulsory major courses" },
    { label: "Elective Engineering", credits: 27, note: "Min. — AI / Digital Media / Interactive / Software tracks" },
    { label: "Field Experience", credits: 6, note: "Practical training / co-op" },
    { label: "Free Elective", credits: 6, note: "Min. — any faculty" },
];

// Course type in the study plan --> credit breakdown category
const TYPE_TO_CATEGORY = {
    "Gen Ed": "General Education",
    Fundamental: "Basic Engineering",
    Compulsory: "Core Engineering",
    Elective: "Elective Engineering",
    "Practical Training": "Field Experience",
    "Free Elective": "Free Elective",
};

// "Practical Training" --> "practical-training", used for the chip color class
const typeClass = (type) => type.toLowerCase().replace(/\s+/g, "-");

// Each year's own credits (not the running total) and course count
const YEAR_SUMMARIES = STUDY_PLAN.reduce((summaries, yearBlock) => {
    const cumulative = Math.max(0, ...yearBlock.semesters.map(semester => semester.totalAccumulated || 0));
    const previous = summaries.length ? summaries[summaries.length - 1].cumulative : 0;
    const courseCount = yearBlock.semesters.reduce((count, semester) => count + semester.courses.length, 0);

    summaries.push({ year: yearBlock.year, yearCredits: cumulative - previous, cumulative, courseCount });
    return summaries;
}, []);

const HEAVIEST_YEAR = Math.max(1, ...YEAR_SUMMARIES.map(year => year.yearCredits));

// All courses grouped by category. Elective Engineering uses the real elective
// list, because the study plan only has "Elective Course" placeholder rows
const ALL_BY_CATEGORY = (() => {
    const groups = Object.fromEntries(CREDIT_BREAKDOWN.map(category => [category.label, []]));

    STUDY_PLAN.forEach(yearBlock =>
        yearBlock.semesters.forEach(semester =>
            semester.courses.forEach(course => {
                const category = TYPE_TO_CATEGORY[course.type];
                if (category && category !== "Elective Engineering") {
                    groups[category].push(course);
                }
            })
        )
    );

    Object.values(ELECTIVE_COURSES).forEach(list =>
        list.forEach(course => groups["Elective Engineering"].push(course))
    );

    return groups;
})();

const barWidth = (value, max) => `${Math.round((value / max) * 100)}%`;

function CourseCard({ course, onSelect }) {
    return (
        <button type="button" className="program-course-card" onClick={() => onSelect(course)}>
            <span className="program-course-top">
                <span>{course.code}</span>
                {/* Elective credits are written like 3(3-0-6), so only plain numbers get "cr" */}
                <span>{/^\d+$/.test(course.credits) ? `${course.credits} cr` : course.credits}</span>
            </span>
            <span className="program-course-name">{course.name}</span>
            {course.type && (
                <span className={`program-type-chip program-type-${typeClass(course.type)}`}>{course.type}</span>
            )}
        </button>
    );
}

function CourseModal({ course, onClose }) {
    // Close the popup with the Escape key
    useEffect(() => {
        if (!course) return;

        const CloseOnEscape = (event) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", CloseOnEscape);
        return () => window.removeEventListener("keydown", CloseOnEscape);
    }, [course, onClose]);

    if (!course) return null;

    const details = COURSE_DESCRIPTIONS[course.code];

    return (
        <div className="program-modal-backdrop" onClick={onClose}>
            <div
                className="program-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="program-modal-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="program-modal-header">
                    <div>
                        <p className="program-modal-code">{course.code}</p>
                        <h3 id="program-modal-title" className="program-modal-title">{course.name}</h3>
                    </div>
                    <button type="button" className="program-modal-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="program-modal-tags">
                    <span className="program-modal-tag">{course.credits} credits</span>
                    {course.categoryLabel && <span className="program-modal-tag">{course.categoryLabel}</span>}
                </div>

                {details ? (
                    <Fragment>
                        {details.prerequisites && (
                            <p className="program-modal-prerequisites">
                                <strong>Prerequisites:</strong> {details.prerequisites}
                            </p>
                        )}
                        <p className="program-modal-description">{details.descriptionEn}</p>
                        {details.descriptionTh && (
                            <p className="program-modal-description-thai">{details.descriptionTh}</p>
                        )}
                        <p className="program-modal-source">Source: official KKU DME curriculum document (มคอ.2)</p>
                    </Fragment>
                ) : (
                    <p className="program-modal-description">
                        Detailed course description not published here yet. Refer to the official KKU course
                        syllabus for full content, prerequisites and learning outcomes.
                    </p>
                )}
            </div>
        </div>
    );
}

export function ProgramEducation() {
    const [section, setSection] = useState("curriculum"); // "curriculum" | "course"
    const [courseView, setCourseView] = useState("plan"); // "plan" | "electives" | "allCourses"
    const [activeTrack, setActiveTrack] = useState(CATEGORIES[0]);
    const [openYear, setOpenYear] = useState(null);
    const [openCategory, setOpenCategory] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const OpenCourse = (course, categoryLabel) => {
        setSelectedCourse({ ...course, categoryLabel: categoryLabel || TYPE_TO_CATEGORY[course.type] || null });
    };

    // Clicking a year or credit card on the overview jumps into the matching course list
    const GoToYear = (year) => {
        setOpenYear(year);
        setCourseView("plan");
        setSection("course");
    };

    const GoToCategory = (label) => {
        setOpenCategory(label);
        setCourseView("allCourses");
        setSection("course");
    };

    return (
        <Fragment>
            <NavigationBar />
            <main className="program-page">
                <section className="program-section" style={{ "--program-background-image": `url(${ProgramBackground})` }}>
                    <h1 className="program-heading-title">Program & Curriculum</h1>
                    <p className="program-heading-description">
                        {PROGRAM_TOTAL_CREDITS} credits over 4 years (Cooperative Education track)
                    </p>
                </section>

                <section className="program-information">
                    <div className="program-tab-buttons">
                        <button
                            type="button"
                            className={`program-tab-button ${section === "curriculum" ? "program-tab-button-active" : ""}`}
                            onClick={() => setSection("curriculum")}
                            aria-pressed={section === "curriculum"}
                        >
                            Curriculum
                        </button>
                        <button
                            type="button"
                            className={`program-tab-button ${section === "course" ? "program-tab-button-active" : ""}`}
                            onClick={() => setSection("course")}
                            aria-pressed={section === "course"}
                        >
                            Course
                        </button>
                    </div>

                    {section === "curriculum" && (
                        <div className="program-overview">
                            <article className="program-panel">
                                <h2 className="program-panel-title">What you'll study</h2>
                                <p className="program-panel-text">
                                    Digital Media Engineering students specialize in developing, implementing and
                                    optimizing technology systems for creating, processing, delivering and displaying
                                    digital content.
                                </p>

                                <div className="program-study-lists">
                                    <div>
                                        <h3 className="program-subheading">Core responsibilities</h3>
                                        <ul className="program-dot-list">
                                            {RESPONSIBILITIES.map(item => <li key={item}>{item}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="program-subheading">Key competencies</h3>
                                        <ul className="program-dot-list">
                                            {COMPETENCIES.map(item => <li key={item}>{item}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </article>

                            <article className="program-panel">
                                <h2 className="program-panel-title">Credit breakdown</h2>
                                <div className="program-card-grid program-card-grid-3">
                                    {CREDIT_BREAKDOWN.map(category => (
                                        <button
                                            key={category.label}
                                            type="button"
                                            className="program-summary-card"
                                            onClick={() => GoToCategory(category.label)}
                                        >
                                            <span className="program-summary-number">{category.credits}</span>
                                            <span className="program-summary-label">{category.label}</span>
                                            {/* Bar = share of the whole degree */}
                                            <span className="program-bar">
                                                <span
                                                    className="program-bar-fill"
                                                    style={{ width: barWidth(category.credits, PROGRAM_TOTAL_CREDITS) }}
                                                />
                                            </span>
                                            <span className="program-summary-note">{category.note}</span>
                                        </button>
                                    ))}
                                </div>
                            </article>

                            <article className="program-panel">
                                <h2 className="program-panel-title">Year by year</h2>
                                <div className="program-card-grid program-card-grid-4">
                                    {YEAR_SUMMARIES.map(year => (
                                        <button
                                            key={year.year}
                                            type="button"
                                            className="program-summary-card"
                                            onClick={() => GoToYear(year.year)}
                                        >
                                            <span className="program-summary-year">Year {year.year}</span>
                                            <span className="program-summary-number">{year.yearCredits}</span>
                                            <span className="program-summary-note">
                                                credits this year · {year.courseCount} courses
                                            </span>
                                            {/* Bar is compared to the heaviest year */}
                                            <span className="program-bar">
                                                <span
                                                    className="program-bar-fill"
                                                    style={{ width: barWidth(year.yearCredits, HEAVIEST_YEAR) }}
                                                />
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </article>
                        </div>
                    )}

                    {section === "course" && (
                        <div className="program-courses">
                            <div className="program-view-buttons">
                                <button
                                    type="button"
                                    className={`program-view-button ${courseView === "plan" ? "program-view-button-active" : ""}`}
                                    onClick={() => {
                                        setOpenYear(null);
                                        setCourseView("plan");
                                    }}
                                >
                                    4-Year Study Plan
                                </button>
                                <button
                                    type="button"
                                    className={`program-view-button ${courseView === "electives" ? "program-view-button-active" : ""}`}
                                    onClick={() => setCourseView("electives")}
                                >
                                    Major Elective Tracks
                                </button>
                                <button
                                    type="button"
                                    className={`program-view-button ${courseView === "allCourses" ? "program-view-button-active" : ""}`}
                                    onClick={() => {
                                        setOpenCategory(null);
                                        setCourseView("allCourses");
                                    }}
                                >
                                    All Courses
                                </button>
                            </div>

                            {courseView === "plan" && STUDY_PLAN.map(yearBlock => {
                                const isOpen = openYear === yearBlock.year;
                                const summary = YEAR_SUMMARIES.find(year => year.year === yearBlock.year);

                                return (
                                    <article key={yearBlock.year} className="program-accordion">
                                        <button
                                            type="button"
                                            className="program-accordion-header"
                                            onClick={() => setOpenYear(current => (current === yearBlock.year ? null : yearBlock.year))}
                                            aria-expanded={isOpen}
                                        >
                                            <span className="program-accordion-title">Year {yearBlock.year}</span>
                                            <span className="program-accordion-meta">
                                                {summary.yearCredits} credits · {summary.courseCount} courses
                                            </span>
                                            <span className={`program-accordion-arrow ${isOpen ? "program-accordion-arrow-open" : ""}`}>▾</span>
                                        </button>

                                        {isOpen && (
                                            <div className="program-accordion-body">
                                                {yearBlock.semesters.map(semester => (
                                                    <div key={semester.name} className="program-semester">
                                                        <h3 className="program-subheading">{semester.name}</h3>
                                                        <div className="program-course-grid program-course-grid-2">
                                                            {semester.courses.map((course, index) => (
                                                                <CourseCard
                                                                    key={`${course.code}-${index}`}
                                                                    course={course}
                                                                    onSelect={selected => OpenCourse(selected)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}

                            {courseView === "electives" && (
                                <Fragment>
                                    <div className="program-track-buttons">
                                        {CATEGORIES.map(track => (
                                            <button
                                                key={track}
                                                type="button"
                                                className={`program-track-button ${activeTrack === track ? "program-track-button-active" : ""}`}
                                                onClick={() => setActiveTrack(track)}
                                                aria-pressed={activeTrack === track}
                                            >
                                                {track}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="program-course-grid program-course-grid-3">
                                        {ELECTIVE_COURSES[activeTrack].map((course, index) => (
                                            <CourseCard
                                                key={`${course.code}-${index}`}
                                                course={course}
                                                onSelect={selected => OpenCourse(selected, "Elective Engineering")}
                                            />
                                        ))}
                                    </div>
                                </Fragment>
                            )}

                            {courseView === "allCourses" && CREDIT_BREAKDOWN.map(category => {
                                const isOpen = openCategory === category.label;
                                const courses = ALL_BY_CATEGORY[category.label];

                                return (
                                    <article key={category.label} className="program-accordion">
                                        <button
                                            type="button"
                                            className="program-accordion-header"
                                            onClick={() => setOpenCategory(current => (current === category.label ? null : category.label))}
                                            aria-expanded={isOpen}
                                        >
                                            <span className="program-accordion-title">{category.label}</span>
                                            <span className="program-accordion-meta">
                                                {category.credits} credits · {courses.length} courses
                                            </span>
                                            <span className={`program-accordion-arrow ${isOpen ? "program-accordion-arrow-open" : ""}`}>▾</span>
                                        </button>

                                        {isOpen && (
                                            <div className="program-accordion-body program-course-grid program-course-grid-3">
                                                {courses.map((course, index) => (
                                                    <CourseCard
                                                        key={`${course.code}-${index}`}
                                                        course={course}
                                                        onSelect={selected => OpenCourse(selected, category.label)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <CourseModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
            </main>
        </Fragment>
    );
}
