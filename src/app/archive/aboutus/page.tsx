"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Heart, Sparkles, Shield, Flame, Globe, Award, Mail, Phone } from "lucide-react";
import styles from "./page.module.css";
import { TeamIllustration, VisionIllustration } from "@/components/Illustrations";

export default function AboutUs() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const slides = [
    {
      title: "Our Vision",
      text: "To become the leading bridge between international students and German higher education or vocational systems, empowering every global learner to achieve their academic and professional goals."
    },
    {
      title: "Our Mission",
      text: "To provide personalized, end-to-end support, from university admissions and visa guidance to accommodation and integration, ensuring a seamless and worry-free transition to life in Germany."
    }
  ];

  // Auto-slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

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
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          WhatsApp: formData.whatsapp,
          message: formData.message
        })
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
            <h1 className={styles.heroTitle}>Who Are We?</h1>
            <p className={styles.heroText}>
              At CASA Solutions, we believe that moving abroad should be exciting, not overwhelming. That&rsquo;s why our mission is to simplify the journey for all individuals, providing end-to-end support in admissions, visa, accommodation, and integration.
            </p>
            <a
              href="https://cal.com/casasolutions/30min"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "14px 32px",
                background: "var(--color-white)",
                color: "var(--color-primary)",
                borderRadius: "30px",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: "15px",
                boxShadow: "var(--shadow-md)"
              }}
            >
              Talk to an Advisor
            </a>
          </div>

          <div className={styles.heroImageContainer}>
            <div className={styles.heroImageCard}>
              <TeamIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className={styles.vision}>
        <div className={styles.visionContainer}>
          <div className={styles.visionImageContainer}>
            <div style={{ width: "100%", maxWidth: "380px" }}>
              <VisionIllustration />
            </div>
          </div>

          <div className={styles.visionContent}>
            <h2 className={styles.visionTitle}>Vision & Mission</h2>
            
            <div className={styles.slider}>
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  className={`${styles.slide} ${idx === currentSlide ? styles.slideActive : ""}`}
                >
                  <h3 className={styles.slideHeading}>{slide.title}</h3>
                  <p className={styles.slideText}>{slide.text}</p>
                </div>
              ))}

              <div className={styles.sliderControls}>
                <button onClick={handlePrevSlide} className={styles.sliderBtn} aria-label="Previous slide">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextSlide} className={styles.sliderBtn} aria-label="Next slide">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className={styles.team}>
        <div className={styles.teamContainer}>
          <div className={styles.teamHeader}>
            <h2 className={styles.teamTitle}>Meet the Team</h2>
          </div>

          <div className={styles.teamGrid}>
            <div className={styles.teamCard}>
              <div className={styles.teamAvatar}>MA</div>
              <h3 className={styles.teamName}>Mahmoud Aljnini</h3>
              <p className={styles.teamRole}>Founder & CEO</p>
              <a
                href="https://www.linkedin.com/in/mahmoud-aljnini/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkedinBtn}
                aria-label="Mahmoud Aljnini LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>

            <div className={styles.teamCard}>
              <div className={styles.teamAvatar}>CT</div>
              <h3 className={styles.teamName}>Christina Tannous</h3>
              <p className={styles.teamRole}>Co-Founder & Digital Transformation Manager</p>
              <a
                href="https://www.linkedin.com/in/christina-tannous/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkedinBtn}
                aria-label="Christina Tannous LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.values}>
        <div className={styles.valuesContainer}>
          <div className={styles.valuesHeader}>
            <h2 className={styles.valuesTitle}>Our Core Values</h2>
            <p className={styles.valuesSubtitle}>Principles that guide CASA Educational Solutions</p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}><Heart size={20} /></div>
              <h3 className={styles.valueTitle}>Empathy</h3>
              <p className={styles.valueDescription}>We care deeply about everyone&rsquo;s experience and treat every applicant&rsquo;s case as our own personal journey.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}><Sparkles size={20} /></div>
              <h3 className={styles.valueTitle}>Clarity</h3>
              <p className={styles.valueDescription}>We communicate clearly and demystify the complex bureaucratic systems of German relocation.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}><Shield size={20} /></div>
              <h3 className={styles.valueTitle}>Trust</h3>
              <p className={styles.valueDescription}>We earn trust by being completely honest, transparent, and reliable from start to finish.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}><Flame size={20} /></div>
              <h3 className={styles.valueTitle}>Commitment</h3>
              <p className={styles.valueDescription}>We are with you for the long run, ensuring you are supported from your first query through to your arrival.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}><Globe size={20} /></div>
              <h3 className={styles.valueTitle}>Cultural Respect</h3>
              <p className={styles.valueDescription}>We value diverse international backgrounds and adapt our support to meet unique individual needs.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}><Award size={20} /></div>
              <h3 className={styles.valueTitle}>Excellence</h3>
              <p className={styles.valueDescription}>We hold ourselves to the highest service standards, delivering accredited solutions for our candidates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section style={{ padding: "100px 24px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-light)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px", maxWidth: "1200px", margin: "0 auto", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--color-primary)", marginBottom: "20px" }}>Take a step forward towards your future</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "30px", fontSize: "16px", lineHeight: 1.7 }}>
              Want to join our programs or have a specific question about your admissions? Send us a message and we will check back with you soon.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", background: "var(--bg-primary)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                <Mail style={{ color: "var(--color-primary)" }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Email Us</div>
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
                <span style={{ fontSize: "48px" }}>🎉</span>
                <h3 style={{ fontSize: "22px", margin: "20px 0 10px", color: "var(--color-primary)" }}>Message Sent!</h3>
                <p style={{ color: "var(--text-secondary)" }}>Your message has been submitted. We will contact you soon on WhatsApp or email.</p>
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
                  <label htmlFor="whatsapp" style={{ fontSize: "14px", fontWeight: 600 }}>WhatsApp</label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    required
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}
                    placeholder="WhatsApp Phone Number"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label htmlFor="message" style={{ fontSize: "14px", fontWeight: 600 }}>Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}
                    placeholder="Your Message"
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
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
