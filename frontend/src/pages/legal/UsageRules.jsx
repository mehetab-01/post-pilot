import LegalLayout from './LegalLayout'

export default function AcceptableUsePolicy() {
  return (
    <LegalLayout title="Acceptable Use Policy">
      <p>
        This Acceptable Use Policy ("AUP") governs your use of PostPilot and its AI content
        generation features. By using the Service, you agree to comply with this policy. Violation
        may result in suspension or termination of your account.
      </p>

      <Section title="1. General Rules">
        <p>You agree that you will not use the Service to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Violate any applicable local, state, national, or international law or regulation.</li>
          <li>
            Generate, store, or distribute content that is illegal, defamatory, obscene, threatening,
            harassing, hateful, or that promotes violence or discrimination against any individual or group.
          </li>
          <li>
            Infringe or misappropriate the intellectual property rights of others, including
            copyrights, trademarks, trade secrets, or patents.
          </li>
          <li>
            Impersonate any person or entity, or falsely state or misrepresent your affiliation with
            a person or entity.
          </li>
          <li>
            Publish AI-generated content that is deliberately misleading, fraudulent, or designed to
            deceive others (e.g., deepfake-style disinformation, fake testimonials, or fabricated
            news).
          </li>
        </ul>
      </Section>

      <Section title="2. AI Content Responsibility">
        <p>
          You understand that PostPilot uses third-party AI models to generate content. You are
          solely responsible for:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>
            <strong>Reviewing all AI-generated content</strong> before publishing, sharing, or using
            it in any way. AI output may contain errors, biases, or inaccuracies.
          </li>
          <li>
            <strong>Ensuring compliance</strong> with each social platform's terms of service,
            community guidelines, and content policies.
          </li>
          <li>
            <strong>Disclosing AI involvement</strong> where required by law, regulation, or
            platform policy (e.g., EU AI Act disclosure requirements).
          </li>
          <li>
            <strong>Not using the Service to generate spam</strong>, mass unsolicited messages, or
            content designed to manipulate platform algorithms.
          </li>
        </ul>
      </Section>

      <Section title="3. API Key Usage">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            You must only use API keys that you own or are authorized to use. Sharing or reselling
            access to third-party API keys through PostPilot is prohibited.
          </li>
          <li>
            You are responsible for complying with the terms of service of any AI provider whose
            API key you use (Anthropic, OpenAI, Google, Groq, etc.).
          </li>
          <li>
            Do not use PostPilot to circumvent rate limits, usage quotas, or content policies of
            third-party providers.
          </li>
        </ul>
      </Section>

      <Section title="4. Platform Integrity">
        <p>You must not:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>
            Attempt to access, probe, or tamper with the Service's infrastructure, other users'
            accounts or data, or any security mechanism.
          </li>
          <li>
            Use automated scripts, bots, or scrapers to access the Service in ways that exceed
            normal human usage patterns.
          </li>
          <li>
            Interfere with or disrupt the Service, its servers, or the networks connected to it.
          </li>
          <li>
            Reverse-engineer, decompile, or disassemble any part of the Service, except as permitted
            by applicable law.
          </li>
        </ul>
      </Section>

      <Section title="5. Content Standards">
        <p>Content generated, stored, or published through PostPilot must not include:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Child sexual abuse material (CSAM) or content that sexualizes minors in any way.</li>
          <li>Non-consensual intimate imagery.</li>
          <li>Malware, phishing links, or content designed to exploit security vulnerabilities.</li>
          <li>Personal data of others without their consent (doxxing).</li>
          <li>Content that promotes self-harm, suicide, or dangerous activities.</li>
          <li>Terrorist or violent extremist content.</li>
        </ul>
        <p className="mt-3">
          We will immediately terminate accounts and report to law enforcement where required for
          the most serious violations.
        </p>
      </Section>

      <Section title="6. Rate Limits &amp; Fair Use">
        <p>
          Each plan has defined generation and posting limits. Circumventing these limits through
          multiple accounts, automation, or any other means violates this policy. We may throttle or
          suspend accounts exhibiting abusive usage patterns.
        </p>
      </Section>

      <Section title="7. Reporting Violations">
        <p>
          If you become aware of any content or activity that violates this policy, please report it
          to{' '}
          <a href="mailto:tabcrypt.in@gmail.com" className="text-amber hover:underline">
            tabcrypt.in@gmail.com
          </a>
          . We will investigate reports promptly and take appropriate action.
        </p>
      </Section>

      <Section title="8. Enforcement">
        <p>
          Violations of this AUP may result in, at our sole discretion: a warning, temporary
          suspension, permanent account termination, or reporting to law enforcement. We reserve the
          right to remove any content that violates this policy without notice.
        </p>
      </Section>

      <Section title="9. Changes">
        <p>
          We may update this AUP from time to time. Material changes will be communicated through
          the Service. Continued use after changes constitutes acceptance.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For questions about this Acceptable Use Policy, contact us at{' '}
          <a href="mailto:tabcrypt.in@gmail.com" className="text-amber hover:underline">
            tabcrypt.in@gmail.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-heading font-semibold text-lg text-heading mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {title}
      </h2>
      {children}
    </section>
  )
}
