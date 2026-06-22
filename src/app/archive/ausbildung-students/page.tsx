"use client";

import React, { useState } from "react";
import { Clock, CircleDollarSign, GraduationCap, Briefcase, HelpCircle, Mail, Phone } from "lucide-react";
import styles from "./page.module.css";
import { AusbildungIllustration } from "@/components/Illustrations";

export default function AusbildungStudents() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("https://formspree.io/f/xldonynj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: "", email: "", whatsapp: "", message: "" });
      }
    } catch {
      alert("Oops! There was a problem submitting your form.");
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
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
              Vocational Training in Germany
            </span>
            <h1 className={styles.heroTitle}>Start Your Ausbildung Journey in Germany</h1>
            <p className={styles.heroText}>
              Gain practical skills, earn a monthly salary while you learn, and secure your long-term career path in one of Europe&rsquo;s strongest, most stable economies.
            </p>
            <div className={styles.heroButtons}>
              <a href="#what-is-ausbildung" className={styles.heroBtnPrimary}>Learn More</a>
              <a
                href="https://cal.com/casasolutions/30min"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroBtnSecondary}
              >
                Get Support
              </a>
            </div>
          </div>

          <div className={styles.heroImageContainer}>
            <div className={styles.heroImageCard}>
              <AusbildungIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* What is Ausbildung Section */}
      <section id="what-is-ausbildung" className={styles.infoSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What is Ausbildung?</h2>
            <p className={styles.sectionIntro}>
              Ausbildung is a highly respected dual vocational training program in Germany that combines theoretical classroom education with hands-on, practical work experience. Candidates work for an employer while attending vocational school (Berufsschule), establishing real-world industry competence.
            </p>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}><Clock size={24} /></div>
              <h3 className={styles.cardTitle}>Duration</h3>
              <p className={styles.cardText}>Typically lasts 2 to 3.5 years depending on the chosen profession, academic background, and work performance.</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}><CircleDollarSign size={24} /></div>
              <h3 className={styles.cardTitle}>Monthly Salary</h3>
              <p className={styles.cardText}>Earn a guaranteed training stipend between €1,000 and €1,300 per month from your employer while studying.</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}><Briefcase size={24} /></div>
              <h3 className={styles.cardTitle}>Career Prospects</h3>
              <p className={styles.cardText}>Extremely high placement rate (over 95%) for full-time corporate employment immediately after graduation.</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}><GraduationCap size={24} /></div>
              <h3 className={styles.cardTitle}>Affordable Education</h3>
              <p className={styles.cardText}>No tuition fees apply to the programs, as they are fully subsidized by the German federal authorities and employers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className={styles.requirements}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Program Requirements</h2>
            <p className={styles.sectionIntro}>To apply for an Ausbildung contract in Germany, you will typically need to meet the following parameters:</p>
          </div>

          <div className={styles.requirementsGrid}>
            <div className={styles.reqCard}>
              <div className={styles.reqIcon}>🎓</div>
              <h3 className={styles.reqTitle}>High School Diploma</h3>
              <p className={styles.reqText}>Or an equivalent secondary school leaving certificate recognized formally in Germany.</p>
            </div>

            <div className={styles.reqCard}>
              <div className={styles.reqIcon}>🗣️</div>
              <h3 className={styles.reqTitle}>German Language</h3>
              <p className={styles.reqText}>At least B1 level (CEFR) standard certified, required to understand lectures and converse at the workplace.</p>
            </div>

            <div className={styles.reqCard}>
              <div className={styles.reqIcon}>🛂</div>
              <h3 className={styles.reqTitle}>Valid Documents</h3>
              <p className={styles.reqText}>A valid passport, translations of educational certificates, and visa paperwork for training (if non-EU).</p>
            </div>

            <div className={styles.reqCard}>
              <div className={styles.reqIcon}>💪</div>
              <h3 className={styles.reqTitle}>High Motivation</h3>
              <p className={styles.reqText}>A strong work ethic, willingness to adapt to German corporate cultures, and eagerness to learn a trade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statsContainer}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>350+</span>
                <span className={styles.statLabel}>Professions Available</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>96%</span>
                <span className={styles.statLabel}>Post-Completion Hired Rate</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>€1,200</span>
                <span className={styles.statLabel}>Avg Monthly Stipend</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>0</span>
                <span className={styles.statLabel}>Tuition Fees Charged</span>
              </div>
            </div>

            <div className={styles.statsIllustration}>
              <div style={{ width: "100%", maxWidth: "340px" }}>
                <HelpCircle size={48} style={{ color: "var(--color-primary)", marginBottom: "20px" }} />
                <h2 style={{ fontSize: "28px", color: "var(--color-primary)", fontWeight: 800, marginBottom: "16px" }}>Why Choose Ausbildung?</h2>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  Unlike traditional university tracks, Ausbildung prioritizes skill-based learning. You graduate with zero debt, several years of professional experience with German corporations on your resume, and a degree that is recognized throughout the entire European Union.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section style={{ padding: "100px 24px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-light)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px", maxWidth: "1200px", margin: "0 auto", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--color-primary)", marginBottom: "20px" }}>Get Support with Your Application</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "30px", fontSize: "16px", lineHeight: 1.7 }}>
              Applying for Ausbildung contracts as an international candidate requires translations, CV formatting in German (Lebenslauf), and mock interview preparation. Our advisors guide you through the whole pipeline.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", background: "var(--bg-primary)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                <Mail style={{ color: "var(--color-primary)" }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Email Support</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>info@casasolutions.co</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", background: "var(--bg-primary)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                <Phone style={{ color: "var(--color-primary)" }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Call Us</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>+49 179 1449246</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-primary)", padding: "40px", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-lg)" }}>
            {isSubmitted ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <span style={{ fontSize: "48px" }}>🚀</span>
                <h3 style={{ fontSize: "22px", margin: "20px 0 10px", color: "var(--color-primary)" }}>Application Sent!</h3>
                <p style={{ color: "var(--text-secondary)" }}>Your request has been received. Our Ausbildung advisor will message you on WhatsApp or email shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label htmlFor="name" style={{ fontSize: "14px", fontWeight: 600 }}>Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}
                    placeholder="Your Name"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label htmlFor="email" style={{ fontSize: "14px", fontWeight: 600 }}>Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}
                    placeholder="Your Email"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label htmlFor="whatsapp" style={{ fontSize: "14px", fontWeight: 600 }}>WhatsApp Number</label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    required
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label htmlFor="message" style={{ fontSize: "14px", fontWeight: 600 }}>German Language Level & Desired Field</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}
                    placeholder="e.g. B1 German standard, Nursing / hospitality, target start next spring"
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: "14px",
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                    color: "var(--color-white)",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(100, 57, 255, 0.15)"
                  }}
                >
                  Apply For Support
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
