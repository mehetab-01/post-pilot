import LegalLayout from './LegalLayout'

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        PostPilot ("we", "us", "our") is operated by TabCrypt. This Privacy Policy describes how we
        collect, use, store, and share information when you use our website, application, and related
        services (collectively, the "Service"). By using the Service you agree to the practices
        described in this policy.
      </p>

      <Section title="1. Information We Collect">
        <SubSection title="1.1 Account Information">
          <p>
            When you create an account we collect your username, email address (optional), and a
            hashed version of your password. We never store plaintext passwords.
          </p>
        </SubSection>
        <SubSection title="1.2 API Keys &amp; OAuth Tokens">
          <p>
            PostPilot uses a "bring-your-own-key" model. API keys you provide (e.g., Claude,
            OpenAI, Groq, or Gemini) and OAuth tokens obtained through connected social accounts
            (LinkedIn, Reddit, X/Twitter) are encrypted at rest using Fernet symmetric encryption
            and stored in our database. We never transmit your keys to any party other than the
            intended provider.
          </p>
        </SubSection>
        <SubSection title="1.3 Content &amp; Usage Data">
          <p>
            We store the content you generate (posts, templates), your generation history, and
            basic usage metrics (generation counts, plan tier). We also collect standard server
            logs (IP address, user-agent, timestamps) for security and debugging purposes.
          </p>
        </SubSection>
        <SubSection title="1.4 Cookies &amp; Local Storage">
          <p>
            We use a JSON Web Token (JWT) stored in <code>localStorage</code> for authentication.
            We do not use third-party tracking cookies. See our{' '}
            <a href="/cookies" className="text-amber hover:underline">Cookie Policy</a> for details.
          </p>
        </SubSection>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide, operate, and maintain the Service.</li>
          <li>To authenticate you and manage your account.</li>
          <li>To route your content generation requests to the AI provider(s) you have configured.</li>
          <li>To publish posts to connected social platforms on your behalf.</li>
          <li>To enforce plan limits and usage quotas.</li>
          <li>To detect and prevent fraud, abuse, or security incidents.</li>
          <li>To send transactional emails (e.g., password reset), if you provided an email.</li>
          <li>To improve the Service through aggregated, anonymized analytics.</li>
        </ul>
      </Section>

      <Section title="3. Data Sharing">
        <p>We do not sell your personal data. We share information only in these cases:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>
            <strong>AI Providers</strong> — Your content prompts are sent to the AI provider whose
            API key you configured. We do not append personal data to prompts.
          </li>
          <li>
            <strong>Social Platforms</strong> — When you use direct-posting, your post content and
            media are sent to the connected platform via their API.
          </li>
          <li>
            <strong>Service Providers</strong> — We may use third-party hosting, database, or email
            providers that process data on our behalf under appropriate agreements.
          </li>
          <li>
            <strong>Legal Obligations</strong> — We may disclose data if required by law, subpoena,
            or governmental request.
          </li>
        </ul>
      </Section>

      <Section title="4. Data Retention">
        <p>
          Account data is retained for as long as your account is active. Post history retention
          depends on your plan (30 days for Starter, unlimited for Pro). You may delete individual
          posts or your entire account at any time. Upon account deletion, we remove your personal
          data and encrypted keys within 30 days, except where retention is required by law.
        </p>
      </Section>

      <Section title="5. Data Security">
        <p>
          We implement industry-standard security measures including encryption at rest (Fernet /
          AES-128-CBC) for sensitive credentials, HTTPS in transit, salted password hashing
          (bcrypt), and environment-variable-based secret management. However, no system is 100%
          secure and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="6. Your Rights">
        <p>
          Depending on your jurisdiction, you may have the right to access, correct, delete, or
          export your personal data. You may also object to or restrict certain processing. To
          exercise these rights, contact us at{' '}
          <a href="mailto:tabcrypt.in@gmail.com" className="text-amber hover:underline">
            tabcrypt.in@gmail.com
          </a>
          . We will respond within 30 days.
        </p>
      </Section>

      <Section title="7. International Transfers">
        <p>
          Our servers may be located outside your country of residence. By using the Service, you
          consent to the transfer of your data to jurisdictions that may have different data
          protection rules. We take steps to ensure adequate safeguards are in place.
        </p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>
          The Service is not directed at individuals under the age of 16. We do not knowingly
          collect data from children. If we learn that we have collected data from a child under 16,
          we will delete it promptly.
        </p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the updated policy on
          this page and update the "Effective date" above. Continued use of the Service after
          changes constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          If you have questions about this Privacy Policy, please contact us at{' '}
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

function SubSection({ title, children }) {
  return (
    <div className="mt-3">
      <h3 className="font-semibold text-heading text-[15px] mb-1">{title}</h3>
      {children}
    </div>
  )
}
