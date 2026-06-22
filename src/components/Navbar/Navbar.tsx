"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu, X, ChevronDown, Building, GraduationCap as Degree,
  ShieldCheck, Home, LogOut, User, Settings,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/unistay/firebase";
import { useAuth } from "@/lib/unistay/auth-context";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close all menus on navigation
  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
    setUserMenuOpen(false);
  }, [pathname]); // eslint-disable-line react-hooks/set-state-in-effect

  // Close user dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      setDropdownOpen((v) => !v);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || null;
  const isUnistay = pathname.startsWith("/unistay");

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>

        {/* Logo */}
        {isUnistay ? (
          <Link href="/unistay/browse" className={styles.logo}>
            <Image
              src="/images/UniStay Primary Logo.png"
              alt="UniStay"
              width={400}
              height={120}
              style={{ height: "40px", width: "auto" }}
              priority
            />
          </Link>
        ) : (
          <Link href="/" className={styles.logo}>
            <Image
              src="/images/1.png"
              alt="Casa Educational Solutions"
              width={160}
              height={79}
              className={styles.logoImage}
              priority
            />
          </Link>
        )}

        {/* Nav items */}
        <ul className={`${styles.menu} ${isOpen ? styles.menuActive : ""}`}>

          {/* ── CASA website nav ── */}
          {!isUnistay && (
            <>
              <li className={styles.item}>
                <Link href="/" className={`${styles.link} ${pathname === "/" ? styles.activeLink : ""}`}>
                  Home
                </Link>
              </li>
              <li className={styles.item}>
                <Link href="/aboutus" className={`${styles.link} ${pathname === "/aboutus" ? styles.activeLink : ""}`}>
                  About Us
                </Link>
              </li>
              <li className={`${styles.item} ${styles.dropdown} ${dropdownOpen ? styles.dropdownOpen : ""}`}>
                <span onClick={toggleDropdown} className={styles.link}>
                  Our Solutions <ChevronDown size={16} className={styles.arrowIcon} />
                </span>
                <ul className={styles.dropdownMenu}>
                  <li><Link href="/solutions#studymatch" className={styles.dropdownLink}><Degree size={16} /> StudyMatch AI</Link></li>
                  <li><Link href="/unistay/browse" className={styles.dropdownLink}><Home size={16} /> UniStay</Link></li>
                  <li><Link href="/ausbildung-students" className={styles.dropdownLink}><Building size={16} /> Ausbildung for Students</Link></li>
                  <li><Link href="/solutions#visa" className={styles.dropdownLink}><ShieldCheck size={16} /> Visa Assistance</Link></li>
                </ul>
              </li>
            </>
          )}

          {/* ── UniStay nav ── */}
          {isUnistay && (
            <>
              <li className={styles.item}>
                <Link href="/unistay/search" className={`${styles.link} ${pathname === "/unistay/search" ? styles.activeLink : ""}`}>
                  View Listings
                </Link>
              </li>
              <li className={styles.navBtn}>
                {user ? (
                  /* User dropdown */
                  <div className={styles.userDropdownWrapper} ref={userMenuRef}>
                    <button
                      className={styles.userDropdownTrigger}
                      onClick={() => setUserMenuOpen((v) => !v)}
                      aria-expanded={userMenuOpen}
                    >
                      {displayName}
                      <ChevronDown
                        size={12}
                        className={`${styles.userChevron} ${userMenuOpen ? styles.userChevronOpen : ""}`}
                      />
                    </button>

                    {userMenuOpen && (
                      <div className={styles.userDropdownPanel}>
                        <Link
                          href="/unistay/dashboard?tab=profile"
                          className={styles.userDropdownItem}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={14} /> Profile
                        </Link>
                        <Link
                          href="/unistay/dashboard?tab=security"
                          className={styles.userDropdownItem}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={14} /> Settings
                        </Link>
                        <div className={styles.userDropdownDivider} />
                        <button
                          className={`${styles.userDropdownItem} ${styles.userDropdownItemDanger}`}
                          onClick={() => { setUserMenuOpen(false); signOut(auth); }}
                        >
                          <LogOut size={14} /> Sign out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/unistay/auth" className={styles.button}>
                    Login / Register
                  </Link>
                )}
              </li>
            </>
          )}

        </ul>

        {/* Mobile hamburger */}
        <button className={styles.toggle} onClick={() => setIsOpen((v) => !v)} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
