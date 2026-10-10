export default function HomePage() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
      <h1>Raaha AI Mock Interview</h1>
      <p>Practise technical interviews with adaptive questions, resume context, voice or text answers, and a live coding challenge.</p>
      <nav aria-label="Main navigation">
        <ul style={{ display: "flex", gap: 16, flexWrap: "wrap", paddingLeft: 20 }}>
          <li><a href="/login">Sign in</a></li>
          <li><a href="/resumes">Parse a resume</a></li>
          <li><a href="/voice-interview">Start an interview</a></li>
          <li><a href="/live-coding">Try live coding</a></li>
          <li><a href="/college-dashboard">College dashboard (authorised TPOs)</a></li>
        </ul>
      </nav>
      <section aria-labelledby="features-heading" style={{ marginTop: 32 }}>
        <h2 id="features-heading">What you can practise</h2>
        <ul>
          <li>Resume-grounded adaptive interview questions</li>
          <li>Voice conversation with a text fallback</li>
          <li>Fair, evidence-oriented answer feedback</li>
          <li>Hidden-test coding practice in an isolated Docker sandbox</li>
        </ul>
      </section>
      <p style={{ marginTop: 24 }}>
        AI-backed resume parsing requires a configured service account. Never upload a resume unless you are comfortable having its text processed by the configured provider.
      </p>
    </main>
  );
}
