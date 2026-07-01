"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../components/AppNav";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "./page.module.css";
import LoginMobile from "./LoginMobile";
import LegalModal from "../components/LegalModal";

async function syncUser(token: string): Promise<boolean> {
  const res = await fetch("/api/auth/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error("Sync failed");
  const { user } = await res.json();
  return !!user?.profile_complete;
}

const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2" />
    <path d="M9.4 5.2A9.4 9.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.7M6.3 6.3A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 2.7-.4" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="19" height="19" viewBox="0 0 48 48">
    <path
      fill="#EA4335"
      d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.3 17.6 9.5 24 9.5Z"
    />
    <path
      fill="#4285F4"
      d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.2-9.6 6.2-17Z"
    />
    <path
      fill="#FBBC05"
      d="M10.4 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1Z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.6 2.1-8.8 2.1-6.4 0-11.8-3.8-13.6-9.2l-7.9 6.1C6.4 42.6 14.6 48 24 48Z"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy">("terms");

  const openLegal = (doc: "terms" | "privacy") => {
    setLegalDoc(doc);
    setLegalOpen(true);
  };

  async function handleEmailLogin() {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      const profileComplete = await syncUser(token);
      router.push(profileComplete ? "/search" : "/register/complete");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      if (
        msg.includes("invalid-credential") ||
        msg.includes("wrong-password") ||
        msg.includes("user-not-found")
      ) {
        setError("Incorrect email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await cred.user.getIdToken();
      const profileComplete = await syncUser(token);
      router.push(profileComplete ? "/search" : "/register/complete");
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.mobileOnly}>
        <LoginMobile onOpenLegal={openLegal} />
      </div>
      <div className={styles.desktopOnly}>
        <div className={styles.page}>
          <AppNav />

          {/* Split */}
          <div className={styles.split}>
            {/* Left image */}
            <div className={styles.imagePanel}>
              <div className={styles.imageBg} />
              <div className={styles.imageContent}>
                <div className={styles.imageRule} />
                <h2 className={styles.imageHeadline}>
                  Elevated living for the global student.
                </h2>
                <p className={styles.imageSub}>
                  Carefully curated spaces across Germany, designed for students
                  who expect more.
                </p>
              </div>
            </div>

            {/* Right form */}
            <div className={styles.formPanel}>
              <div className={styles.formInner}>
                <p className={styles.subline}>
                  Sign in to manage your stays and explore listings.
                </p>

                {/* Email */}
                <label className={styles.label}>Email address</label>
                <div className={styles.fieldWrap}>
                  <span
                    className={styles.fieldIcon}
                    style={{ color: email ? "#6d28d9" : "#b0aabf" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    className={styles.field}
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div className={styles.pwLabelRow}>
                  <label className={styles.label} style={{ margin: 0 }}>
                    Password
                  </label>
                  <a href="#" className={styles.forgotLink}>
                    Forgot password?
                  </a>
                </div>
                <div className={styles.fieldWrapPw}>
                  <span
                    className={styles.fieldIcon}
                    style={{ color: password ? "#6d28d9" : "#b0aabf" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="4" y="11" width="16" height="9" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </span>
                  <input
                    type={pwVisible ? "text" : "password"}
                    className={styles.fieldPw}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setPwVisible(!pwVisible)}
                  >
                    {pwVisible ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#c2557a",
                      margin: "0 0 12px",
                      textAlign: "center",
                    }}
                  >
                    {error}
                  </p>
                )}

                {/* Sign In */}
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleEmailLogin}
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign In"}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>

                {/* Divider */}
                <div className={styles.divider}>
                  <span className={styles.dividerLine} />
                  <span className={styles.dividerLabel}>Or continue with</span>
                  <span className={styles.dividerLine} />
                </div>

                {/* Google */}
                <button
                  type="button"
                  className={styles.googleBtn}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <p className={styles.footerText}>
                  Don&apos;t have an account?{" "}
                  <a href="/register" className={styles.link}>
                    Create one for free
                  </a>
                </p>
                <p className={styles.legalText}>
                  By continuing, you agree to UniStay&apos;s{" "}
                  <button
                    type="button"
                    onClick={() => openLegal("terms")}
                    className={styles.legalLink}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      font: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Terms
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => openLegal("privacy")}
                    className={styles.legalLink}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      font: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LegalModal
        isOpen={legalOpen}
        onClose={() => setLegalOpen(false)}
        initialDoc={legalDoc}
        mode="view"
      />
    </>
  );
}
