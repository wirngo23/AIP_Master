import { Aperture, ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
export const metadata = { title: "AIP — Development and evidence roadmap" };
export default function Development() {
  return (
    <main className="roadmap">
      <a href="/" className="text-link">
        <ArrowLeft size={15} /> Back to AIP
      </a>
      <h1>
        A considered path
        <br />
        to clinical intelligence.
      </h1>
      <p className="muted">
        AIP begins with a working appearance-exploration and consultation
        foundation. Clinical prediction is a separate development program with
        its own evidence, governance, and release gates.
      </p>
      <div className="workspace-notice">
        <ShieldCheck size={20} />
        <span>
          This release uses texture-preserving image deformation. It does not
          model Botox dose, filler volume, muscle response, injection sites, or
          patient-specific wear-off.
        </span>
      </div>
      <div className="roadmap-grid">
        {[
          {
            phase: "01 / AVAILABLE IN THIS BUILD",
            title: "Experience foundation",
            items: [
              "20 preference directions across two optional style collections.",
              "Browser photo preparation, framing, comparison, and conceptual progression.",
              "Account-scoped study storage, optional private photo storage, and deletion.",
              "Private consultation drafts, review notes, and clinic embed configuration.",
            ],
          },
          {
            phase: "02 / NEXT PRODUCT MILESTONE",
            title: "Connected clinic pilot",
            items: [
              "Verified clinic identity, practitioner membership, and role-based access.",
              "Explicit patient-to-clinic sharing grants and revocation.",
              "Real appointment availability, booking confirmations, and consented follow-up.",
              "Public embed security, domain verification, accessibility and independent security review.",
            ],
          },
          {
            phase: "03 / CLINICAL RESEARCH GATE",
            title: "Treatment response engine",
            items: [
              "Consent-based longitudinal data with standardized photographs and expression capture.",
              "Product-specific, region-specific, nonlinear dose and tissue-response models.",
              "Prospective calibration, subgroup performance, uncertainty, and abstention testing.",
              "Clinician governance and jurisdiction-specific regulatory assessment before clinical claims.",
            ],
          },
          {
            phase: "04 / SEPARATE RELEASE GATE",
            title: "Clinical planning assistance",
            items: [
              "Qualified clinician access with confirmed patient assessment.",
              "Validated candidate target rationale with limitations and clinician oversight.",
              "Human-factors testing, independent review, change control, and safety monitoring.",
              "No autonomous prescribing or self-injection instructions.",
            ],
          },
        ].map((card) => (
          <section className="panel roadmap-card" key={card.phase}>
            <span className="tiny-label">{card.phase}</span>
            <h2>{card.title}</h2>
            <ul>
              {card.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="panel roadmap-card" style={{ marginTop: 20 }}>
        <Aperture size={28} />
        <h2>Differentiation is a hypothesis to prove.</h2>
        <p>
          AIP’s intended advantage is a unified journey across personal
          exploration, clinical consultation, longitudinal evidence, and clinic
          onboarding. Superior clinical accuracy, reduced practitioner error,
          increased conversion, and better outcomes have not been established by
          this prototype. Comparative studies and real-world pilots must
          substantiate those claims.
        </p>
        <a
          className="text-link"
          style={{ marginTop: 20 }}
          href="https://github.com/wirngo23/AIP_Master"
          target="_blank"
          rel="noreferrer"
        >
          AIP source repository <ArrowUpRight size={15} />
        </a>
      </section>
    </main>
  );
}
