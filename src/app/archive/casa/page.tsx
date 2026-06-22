"use client";

import React, { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, GraduationCap, Building, BookOpen, Compass, ShieldCheck, Mail, Phone, MapPin, Star } from "lucide-react";
import styles from "./page.module.css";
import { HeroIllustration, BankIllustration } from "@/components/Illustrations";

export default function Home() {
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
      } else {
        alert("Oops! There was a problem submitting your form. Please try again.");
      }
    } catch {
      alert("Oops! There was a problem submitting your form. Please try again.");
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
              Your Germany Journey Starts Here
            </span>
            <h1 className={styles.heroTitle}>The One-Stop-Shop Where Your German Dream Begins</h1>
            <p className={styles.heroDescription}>
              From university eligibility checks to accommodation finding and student visa guidance, we simplify every step of your journey to Germany.
            </p>
            <a
              href="https://cal.com/casasolutions/30min"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtn}
            >
              Talk to an Advisor
            </a>
          </div>

          <div className={styles.heroImageContainer}>
            <div className={styles.heroImageCard}>
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Our Solutions Section */}
      <section id="services" className={styles.services}>
        <div className={styles.servicesContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Solutions</h2>
            <p className={styles.sectionSubtitle}>
              Tailored services engineered to ensure a seamless transition for international students and professionals moving to Germany.
            </p>
          </div>

          <div className={styles.servicesGrid}>
            {/* Card 1: StudyMatch AI */}
            <div className={styles.serviceCard}>
              <div className={styles.cardIcon}>
                <Compass size={28} />
              </div>
              <h3 className={styles.cardTitle}>StudyMatch AI</h3>
              <p className={styles.cardDescription}>
                An AI-powered tool that helps you check your university eligibility, match with the right degree programs in Germany, and get real-time answers.
              </p>
              <Link href="/solutions#studymatch" className={styles.cardBtn}>
                Check My Eligibility <ArrowRight size={16} />
              </Link>
            </div>

            {/* Card 2: Language & Integration */}
            <div className={styles.serviceCard}>
              <div className={styles.cardIcon}>
                <BookOpen size={28} />
              </div>
              <h3 className={styles.cardTitle}>Language & Integration</h3>
              <p className={styles.cardDescription}>
                Tailored German language training (A1 to C1) and cultural integration guidance to prepare you for academic and workplace success in Germany.
              </p>
              <a
                href="https://api.whatsapp.com/send/?phone=4917686347176&text=Hello%20CASA,%20I%27d%20like%20to%20learn%20German!"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cardBtn}
              >
                Start Learning <ArrowRight size={16} />
              </a>
            </div>

            {/* Card 3: Ausbildung */}
            <div className={styles.serviceCard}>
              <div className={styles.cardIcon}>
                <Building size={28} />
              </div>
              <h3 className={styles.cardTitle}>Ausbildung Program</h3>
              <p className={styles.cardDescription}>
                Earn a monthly salary (€1,000–€1,300) while completing a dual vocational training course with top tier German corporate employers.
              </p>
              <Link href="/ausbildung-students" className={styles.cardBtn}>
                Apply Now <ArrowRight size={16} />
              </Link>
            </div>

            {/* Card 4: Visa Assistance */}
            <div className={styles.serviceCard}>
              <div className={styles.cardIcon}>
                <ShieldCheck size={28} />
              </div>
              <h3 className={styles.cardTitle}>Visa Assistance</h3>
              <p className={styles.cardDescription}>
                End-to-end guidance for your German student or work visa, including document reviews, appointment prep, and local authority guidelines.
              </p>
              <a
                href="https://api.whatsapp.com/send/?phone=4917686347176&text=Hello%20CASA,%20I%20need%20visa%20assistance."
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cardBtn}
              >
                Get Visa Help <ArrowRight size={16} />
              </a>
            </div>

            {/* Card 5: UniStay */}
            <div className={styles.serviceCard}>
              <div className={styles.cardIcon}>
                <GraduationCap size={28} />
              </div>
              <h3 className={styles.cardTitle}>UniStay Housing</h3>
              <p className={styles.cardDescription}>
                Find and secure safe, verified, and affordable student flatshares (WG) or private apartments in top German university cities before you land.
              </p>
              <Link href="/unistay" className={styles.cardBtn}>
                Find Housing <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fintiba Section */}
      <section className={styles.fintiba}>
        <div className={styles.fintibaContainer}>
          <div className={styles.fintibaContent}>
            <h2 className={styles.fintibaTitle}>German Blocked Account with Fintiba</h2>
            <p className={styles.fintibaDescription}>
              Open your mandatory blocked account (Sperrkonto) online with Fintiba, officially recognized by the German Federal Foreign Office. Fast, fully digital setup tailored perfectly for international students and visa applicants.
            </p>
            <a
              href="https://partner.fintiba.com/casaconsultancy"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.fintibaBtn}
            >
              Open Your Blocked Account Now
            </a>
          </div>

          <div className={styles.fintibaImageContainer}>
            <div style={{ width: "100%", maxWidth: "380px" }}>
              <BankIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews/Testimonials Section */}
      <section className={styles.reviews}>
        <div className={styles.reviewsContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What Our Students Say</h2>
            <p className={styles.sectionSubtitle}>
              Read reviews from international candidates who successfully transitioned to Germany under CASA Solutions guidance.
            </p>
          </div>

          {/* Tagembed Widget */}
          <div style={{ width: "100%", overflow: "hidden", marginBottom: "40px", borderRadius: "12px" }}>
            <div 
              className="tagembed-widget" 
              style={{ width: "100%", height: "100%", minHeight: "200px", overflow: "auto" }} 
              data-widget-id="303671" 
              data-website="1"
            />
          </div>

          <Script src="https://widget.tagembed.com/embed.min.js" strategy="lazyOnload" />

          <div className={styles.reviewsGrid}>
            <div className={styles.reviewCard}>
              <div className={styles.rating}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className={styles.reviewText}>
                &ldquo;CASA Solutions made my move to Munich incredibly smooth. Finding flatshares (WG) in Germany is famously difficult, but UniStay secured a modern room for me within 2 weeks of subscribing.&rdquo;
              </p>
              <div className={styles.reviewAuthor}>
                <div className={styles.authorAvatar}>AH</div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>Ahmad H.</span>
                  <span className={styles.authorRole}>TU Munich Student</span>
                </div>
              </div>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.rating}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className={styles.reviewText}>
                &ldquo;I applied for the Ausbildung program in nursing. CASA checked my transcripts, translated my cv, helped me reach B2 German, and booked my interview. I am now working and earning in Germany!&rdquo;
              </p>
              <div className={styles.reviewAuthor}>
                <div className={styles.authorAvatar}>SD</div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>Sandra D.</span>
                  <span className={styles.authorRole}>Nurse Apprentice</span>
                </div>
              </div>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.rating}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className={styles.reviewText}>
                &ldquo;The Fintiba blocked account recommendation saved me. Setup was done online, and the visa office approved it instantly. The advisors are super helpful and answer on WhatsApp at any time!&rdquo;
              </p>
              <div className={styles.reviewAuthor}>
                <div className={styles.authorAvatar}>KM</div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>Karan M.</span>
                  <span className={styles.authorRole}>Mechanical Engineering student</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className={styles.contact}>
        <div className={styles.contactContainer}>
          <div className={styles.contactInfo}>
            <h2 className={styles.contactTitle}>Take a step forward towards your future</h2>
            <p className={styles.contactText}>
              Have questions about university admissions, blocked accounts, accommodation, or language courses? Get in touch with our expert advisory team today.
            </p>

            <div className={styles.contactCards}>
              <div className={styles.contactCard}>
                <div className={styles.contactCardIcon}><Mail size={20} /></div>
                <div className={styles.contactCardContent}>
                  <span className={styles.contactCardLabel}>Email Us</span>
                  <span className={styles.contactCardValue}>info@casasolutions.co</span>
                </div>
              </div>

              <div className={styles.contactCard}>
                <div className={styles.contactCardIcon}><Phone size={20} /></div>
                <div className={styles.contactCardContent}>
                  <span className={styles.contactCardLabel}>Call Advisory</span>
                  <span className={styles.contactCardValue}>+49 179 1449246</span>
                </div>
              </div>

              <div className={styles.contactCard}>
                <div className={styles.contactCardIcon}><MapPin size={20} /></div>
                <div className={styles.contactCardContent}>
                  <span className={styles.contactCardLabel}>Our HQ</span>
                  <span className={styles.contactCardValue}>Neumarkt in der Oberpfalz, Germany</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            {isSubmitted ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <span style={{ fontSize: "48px" }}>🎉</span>
                <h3 style={{ fontSize: "22px", margin: "20px 0 10px", color: "var(--color-primary)" }}>Thank You!</h3>
                <p style={{ color: "var(--text-secondary)" }}>Your message has been sent successfully. An advisor will message you on WhatsApp or email shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Your Full Name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="you@example.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="whatsapp" className={styles.label}>WhatsApp Number</label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    required
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message" className={styles.label}>Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    placeholder="Tell us about your educational plans or questions..."
                  />
                </div>

                <button type="submit" className={styles.submitBtn}>
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
