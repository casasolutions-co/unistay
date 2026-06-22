"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, Mail, Lock, ArrowRight } from "lucide-react";
import styles from "./page.module.css";

export default function Login() {
  const [role, setRole] = useState<"student" | "partner">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      alert(`Successfully logged in as ${role === "student" ? "Student" : "Partner"}!`);
    }, 1500);
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <GraduationCap size={24} />
          </div>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Log in to manage your German application portal</p>
        </div>

        {/* Tab Role Selector */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${role === "student" ? styles.activeTab : ""}`}
            onClick={() => setRole("student")}
          >
            Student Portal
          </button>
          <button
            type="button"
            className={`${styles.tab} ${role === "partner" ? styles.activeTab : ""}`}
            onClick={() => setRole("partner")}
          >
            Partner / Agent
          </button>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={18} />
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className={styles.optionsRow}>
            <label className={styles.rememberMe}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              Remember me
            </label>
            <Link href="/login#" className={styles.forgotPassword}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Authenticating..." : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                Log In <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div className={styles.footerText}>
          Don&rsquo;t have an account yet?{" "}
          <Link href="/#" className={styles.signUpLink}>
            Talk to an Advisor
          </Link>
        </div>
      </div>
    </div>
  );
}
