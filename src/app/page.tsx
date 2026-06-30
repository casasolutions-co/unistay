export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    }}>
      <p style={{
        fontFamily: "var(--font-ui)",
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "var(--brand)",
        margin: 0,
      }}>
        UNISTAY
      </p>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: 40,
        letterSpacing: "-0.03em",
        color: "var(--text)",
        margin: 0,
      }}>
        Admin Dashboard
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: 15, margin: 0 }}>
        Coming soon
      </p>
    </main>
  );
}
