import Link from "next/link";

const FEATURES = [
  { href: "/resumes", title: "Resume parser", description: "Upload a PDF to extract a validated skills, projects, branch and CGPA profile." },
  { href: "/voice-interview", title: "Adaptive mock interview", description: "Practise with speech or text, answer follow-ups, and review scoring signals." },
  { href: "/live-coding", title: "Live coding round", description: "Solve a coding challenge against hidden server-side test cases." },
  { href: "/college-dashboard", title: "College dashboard", description: "View privacy-protected cohort insights when an authorised TPO account is configured." },
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px 56px" }}>
      <header>
        <h1>Raaha AI Mock Interview</h1>
        <p>Practise technical interviews, work through coding challenges, and identify skills to improve.</p>
      </header>
      <nav aria-label="Account navigation" style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "24px 0" }}>
        <Link href="/login">Sign in</Link>
        <Link href="/resumes">Start with a resume</Link>
        <Link href="/voice-interview">Start an interview</Link>
      </nav>
      <section aria-labelledby="feature-heading">
        <h2 id="feature-heading">Practice tools</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {FEATURES.map((feature) => (
            <article key={feature.href} style={{ border: "1px solid #d8dee8", borderRadius: 12, padding: 18 }}>
              <h3><Link href={feature.href}>{feature.title}</Link></h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
      <p style={{ marginTop: 28, fontSize: 14 }}>
        This is a staging version. Sign-in and AI-backed resume parsing require valid service credentials.
        Interview scoring is a practice signal, not a hiring decision.
      </p>
    </main>
  );
}
