"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Compass, BookOpen, Building, ShieldCheck, Home } from "lucide-react";
import styles from "./page.module.css";

export default function Solutions() {
  const [degree, setDegree] = useState("");
  const [germanLevel, setGermanLevel] = useState("");
  const [eligibilityResult, setEligibilityResult] = useState<string | null>(null);

  const checkEligibility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!degree || !germanLevel) {
      alert("Please fill in all options.");
      return;
    }

    if (degree === "bachelors" && (germanLevel === "c1" || germanLevel === "b2")) {
      setEligibilityResult("High Eligibility: You qualify for direct bachelor's programs. You can choose from a large catalog of universities!");
    } else if (degree === "masters" && (germanLevel === "c1" || germanLevel === "b2" || germanLevel === "english")) {
      setEligibilityResult("High Eligibility: You qualify for master's programs in Germany (including English-taught options)!");
    } else if (degree === "highschool" && germanLevel === "b1") {
      setEligibilityResult("Good Match: You qualify for the Ausbildung (vocational training) or Studienkolleg (foundation year) tracks!");
    } else if (germanLevel === "a1" || germanLevel === "a2") {
      setEligibilityResult("Language Needed: You must enroll in our intensive German courses to reach at least B1/B2 level to qualify for admissions.");
    } else {
      setEligibilityResult("Partially Eligible: We recommend a personal 30-minute counseling call to inspect your specific transcripts.");
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <span className="badge" style={{
            background: "rgba(255, 255, 255, 0.15)",
            color: "var(--color-accent)",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            Our Suite of Solutions
          </span>
          <h1 className={styles.heroTitle}>Comprehensive Relocation Solutions</h1>
          <p className={styles.heroText}>
            Tailored programs and digital tools designed to guide you through every stage of your relocation, studies, and career setup in Germany.
          </p>
        </div>
      </section>

      {/* Solutions Detailed List */}
      <section className={styles.solutionsList}>
        <div className={styles.container}>
          
          {/* Solution 1: StudyMatch AI (with simulated interactive calculator) */}
          <div id="studymatch" className={styles.solutionItem}>
            <div className={styles.solutionContent}>
              <span className={styles.solutionTag}>Admissions & AI</span>
              <h2 className={styles.solutionTitle}>StudyMatch AI Eligibility Checker</h2>
              <p className={styles.solutionDescription}>
                Wondering if your qualifications are recognized in Germany? Use our interactive checker below to simulate your university admission odds.
              </p>
              
              {/* Simulator Card */}
              <div style={{
                background: "var(--bg-secondary)",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid var(--border-light)",
                width: "100%",
                boxShadow: "var(--shadow-sm)",
                margin: "10px 0"
              }}>
                <h4 style={{ marginBottom: "16px", color: "var(--color-primary)", fontWeight: 700 }}>Quick Eligibility Check</h4>
                <form onSubmit={checkEligibility} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600 }}>Highest Qualification</label>
                    <select
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "var(--bg-primary)" }}
                    >
                      <option value="">-- Select Qualification --</option>
                      <option value="highschool">High School Diploma</option>
                      <option value="bachelors">Bachelor&rsquo;s Degree</option>
                      <option value="masters">Master&rsquo;s Degree</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600 }}>German Language Level</label>
                    <select
                      value={germanLevel}
                      onChange={(e) => setGermanLevel(e.target.value)}
                      style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "var(--bg-primary)" }}
                    >
                      <option value="">-- Select Language Level --</option>
                      <option value="a1">A1 / A2 (Beginner)</option>
                      <option value="b1">B1 (Intermediate)</option>
                      <option value="b2">B2 (Upper Intermediate)</option>
                      <option value="c1">C1 (Advanced)</option>
                      <option value="english">Only English-taught (IELTS/TOEFL)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{
                      padding: "10px",
                      background: "var(--color-primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Check Match Odds
                  </button>
                </form>

                {eligibilityResult && (
                  <div style={{
                    marginTop: "16px",
                    padding: "12px",
                    borderRadius: "6px",
                    background: "rgba(100, 57, 255, 0.05)",
                    borderLeft: "4px solid var(--color-primary)",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "var(--text-primary)"
                  }}>
                    {eligibilityResult}
                  </div>
                )}
              </div>

              <a
                href="https://cal.com/casasolutions/30min"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.solutionBtn}
              >
                Book Advisory Session
              </a>
            </div>
            <div className={styles.solutionVisual}>
              <div className={styles.visualCard} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center" }}>
                <Compass size={48} style={{ color: "var(--color-primary)" }} />
                <h4 style={{ fontSize: "18px", fontWeight: 700 }}>StudyMatch AI Features</h4>
                <ul className={styles.solutionFeatures}>
                  <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Official database checks</li>
                  <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> University matches in minutes</li>
                  <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Document requirements checklists</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Solution 2: Language & Integration */}
          <div id="language" className={styles.solutionItem}>
            <div className={styles.solutionContent}>
              <span className={styles.solutionTag}>Academics & Culture</span>
              <h2 className={styles.solutionTitle}>Language and Integration</h2>
              <p className={styles.solutionDescription}>
                German language skills are the master key to finding a job, integrating socially, and succeeding in local universities. We offer certified native coaching.
              </p>
              <ul className={styles.solutionFeatures}>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Live interactive online classes</li>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> A1-C1 Test preparation (TestDaF, Goethe, telc)</li>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Cultural workshops & local bureau guides</li>
              </ul>
              <a
                href="https://api.whatsapp.com/send/?phone=4917686347176&text=Hello%20CASA,%20I%20want%20to%20learn%20German."
                target="_blank"
                rel="noopener noreferrer"
                className={styles.solutionBtn}
              >
                Start Learning German
              </a>
            </div>
            <div className={styles.solutionVisual}>
              <div className={styles.visualCard} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center" }}>
                <BookOpen size={48} style={{ color: "var(--color-primary)" }} />
                <h4 style={{ fontSize: "18px", fontWeight: 700 }}>Integration Course</h4>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Includes mock conversations, CV formatting, and registration tips for Germany.</p>
              </div>
            </div>
          </div>

          {/* Solution 3: Ausbildung */}
          <div id="ausbildung" className={styles.solutionItem}>
            <div className={styles.solutionContent}>
              <span className={styles.solutionTag}>Careers</span>
              <h2 className={styles.solutionTitle}>Ausbildung (Vocational Training)</h2>
              <p className={styles.solutionDescription}>
                Combine tuition-free classroom education with a paid internship at German companies. We assist you in sourcing contracts, processing visas, and translating cvs.
              </p>
              <ul className={styles.solutionFeatures}>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> €1,000 to €1,300 guaranteed monthly salary</li>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> 350+ career fields (Nursing, IT, Logistics, Tech)</li>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Permanent residency pathway after 2 years</li>
              </ul>
              <Link href="/ausbildung-students" className={styles.solutionBtn}>
                Explore Ausbildung Details
              </Link>
            </div>
            <div className={styles.solutionVisual}>
              <div className={styles.visualCard} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center" }}>
                <Building size={48} style={{ color: "var(--color-primary)" }} />
                <h4 style={{ fontSize: "18px", fontWeight: 700 }}>Corporate Placement</h4>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Contract placement with vetted German employers. B1 German certificate required.</p>
              </div>
            </div>
          </div>

          {/* Solution 4: Visa Assistance */}
          <div id="visa" className={styles.solutionItem}>
            <div className={styles.solutionContent}>
              <span className={styles.solutionTag}>Legals</span>
              <h2 className={styles.solutionTitle}>Visa Assistance</h2>
              <p className={styles.solutionDescription}>
                Navigating the German consulate regulations can be tough. We audit your blocked account setup, insurance policies, and university admission letters for visa approval.
              </p>
              <ul className={styles.solutionFeatures}>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Review of financial blocked accounts</li>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Comprehensive document checklists</li>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Appointmentbooking support</li>
              </ul>
              <a
                href="https://api.whatsapp.com/send/?phone=4917686347176&text=Hello%20CASA,%20I%20need%20visa%20help."
                target="_blank"
                rel="noopener noreferrer"
                className={styles.solutionBtn}
              >
                Get Visa Support
              </a>
            </div>
            <div className={styles.solutionVisual}>
              <div className={styles.visualCard} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center" }}>
                <ShieldCheck size={48} style={{ color: "var(--color-primary)" }} />
                <h4 style={{ fontSize: "18px", fontWeight: 700 }}>100% Visa Compliance</h4>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Guidance on Fintiba blocked accounts and public health insurances (AOK, TK, DAK).</p>
              </div>
            </div>
          </div>

          {/* Solution 5: UniStay */}
          <div id="unistay" className={styles.solutionItem}>
            <div className={styles.solutionContent}>
              <span className={styles.solutionTag}>Housing</span>
              <h2 className={styles.solutionTitle}>UniStay Student Housing</h2>
              <p className={styles.solutionDescription}>
                Secure a verified, legal rental room in Germany before boarding your flight. Avoid landlord scams and find clean flatshares or apartments.
              </p>
              <ul className={styles.solutionFeatures}>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Verified landlord listings</li>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Contract audit & registration (Anmeldung) guarantee</li>
                <li className={styles.featureItem}><Check size={16} className={styles.featureIcon} /> Settle in with city registration guides</li>
              </ul>
              <Link href="/unistay" className={styles.solutionBtn}>
                Search Housing Rooms
              </Link>
            </div>
            <div className={styles.solutionVisual}>
              <div className={styles.visualCard} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center" }}>
                <Home size={48} style={{ color: "var(--color-primary)" }} />
                <h4 style={{ fontSize: "18px", fontWeight: 700 }}>Flatshare Sourcing</h4>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>WG rooms and apartments in Munich, Berlin, Frankfurt, Hamburg, and Stuttgart.</p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
