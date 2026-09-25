import { Fragment, useState } from "react";
import { NavigationBar } from "./components/navBar";
import "../css_styles/css_pages/tuition_fee_style.css";
import TuitionBackground from "../../assets/images/Dme_graduate1.png";

import { STUDENT_TYPES, FEE_BREAKDOWN, MEKONG_COUNTRIES, grandTotal, formatBaht } from "../data/tuitionData.js";

const PERIODS = ["Per Semester", "Full 4 Years"];

// Academic and living costs render the same way, so both tables use this one
function FeeTable({ rows }) {
    return (
        <table className="tuition-fee-table">
            <tbody>
                {rows.map(row => (
                    <tr key={row.item}>
                        <td className="tuition-fee-item">
                            {row.item}
                            <span className="tuition-fee-type">{row.type}</span>
                        </td>
                        <td className="tuition-fee-amount">{formatBaht(row.amount)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function TuitionFee() {
    const [statusId, setStatusId] = useState("thai");
    const [period, setPeriod] = useState("Per Semester");

    const status = STUDENT_TYPES.find(type => type.id === statusId);
    const rows = FEE_BREAKDOWN[status.id][period];

    const academicRows = rows.filter(row => row.type === "Mandatory" || row.type === "One-time");
    const livingRows = rows.filter(row => row.type === "Optional");
    const showLiving = status.hasLivingCost && livingRows.length > 0;

    // Only sum the rows shown on screen, so the total always matches the tables above it
    const total = grandTotal(showLiving ? [...academicRows, ...livingRows] : academicRows, period);

    return (
        <Fragment>
            <NavigationBar />
            <main className="tuition-page">
                <section className="tuition-section" style={{ "--tuition-background-image": `url(${TuitionBackground})` }}>
                    <h1 className="tuition-heading-title">Tuition & Fees</h1>
                    <p className="tuition-heading-description">
                        Choose your student type to see the academic and living costs of the DME program
                    </p>
                </section>

                <section className="tuition-information">
                    {/* Student type selection */}
                    <div className="tuition-type-grid">
                        {STUDENT_TYPES.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                className={`tuition-type-card ${status.id === type.id ? "tuition-type-card-active" : ""}`}
                                onClick={() => setStatusId(type.id)}
                                aria-pressed={status.id === type.id}
                            >
                                <span className="tuition-type-label">{type.label}</span>
                                <span className="tuition-type-caption">Semester fee</span>
                                <span className="tuition-type-fee">{formatBaht(type.semesterFee)}</span>
                            </button>
                        ))}
                    </div>

                    {status.id === "mekong" && (
                        <p className="tuition-mekong-note">
                            Mekong Region rate applies to students from: {MEKONG_COUNTRIES.join(", ")}.
                        </p>
                    )}

                    <article className="tuition-panel">
                        <div className="tuition-panel-header">
                            <div>
                                <h2 className="tuition-panel-title">Fee Breakdown</h2>
                                <p className="tuition-panel-description">Detailed costs for {status.label}</p>
                            </div>

                            <div className="tuition-period-buttons">
                                {PERIODS.map(periodName => (
                                    <button
                                        key={periodName}
                                        type="button"
                                        className={`tuition-period-button ${period === periodName ? "tuition-period-button-active" : ""}`}
                                        onClick={() => setPeriod(periodName)}
                                        aria-pressed={period === periodName}
                                    >
                                        {periodName}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <h3 className="tuition-table-heading">Academic Costs</h3>
                        <FeeTable rows={academicRows} />

                        {showLiving && (
                            <Fragment>
                                <h3 className="tuition-table-heading">Estimated Living Costs</h3>
                                <FeeTable rows={livingRows} />
                            </Fragment>
                        )}

                        <div className="tuition-total">
                            <div>
                                <p className="tuition-total-label">Grand Total ({period})</p>
                                <p className="tuition-total-note">
                                    {period === "Per Semester"
                                        ? "Mandatory academic fees" + (showLiving ? " + 4 months of estimated living costs." : ".")
                                        : "8 semesters of academic fees" + (showLiving ? " + ~40 months of estimated living costs." : ".")}
                                </p>
                            </div>
                            <p className="tuition-total-amount">{formatBaht(total)}</p>
                        </div>
                    </article>

                    <p className="tuition-source">
                        International rates from the official program page:{" "}
                        <a href="https://www.en.kku.ac.th/web/en/beng-dme/" target="_blank" rel="noreferrer">
                            en.kku.ac.th/web/en/beng-dme
                        </a>
                        . Thai student rate from the Studio 4 Final Report, to confirm with the faculty.
                    </p>
                </section>
            </main>
        </Fragment>
    );
}
