import LegalLayout from './LegalLayout'

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy">
      <p>
        This Cookie Policy explains how PostPilot (operated by TabCrypt) uses cookies and similar
        technologies when you visit our website and use our Service.
      </p>

      <Section title="1. What Are Cookies?">
        <p>
          Cookies are small text files stored on your device by your browser. They are widely used
          to make websites work efficiently and to provide information to site operators. Similar
          technologies include <code>localStorage</code>, <code>sessionStorage</code>, and web
          beacons.
        </p>
      </Section>

      <Section title="2. How We Use Cookies &amp; Local Storage">
        <p>PostPilot uses minimal client-side storage:</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-heading font-semibold">Name / Key</th>
                <th className="py-2 pr-4 text-heading font-semibold">Type</th>
                <th className="py-2 pr-4 text-heading font-semibold">Purpose</th>
                <th className="py-2 text-heading font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4"><code>token</code></td>
                <td className="py-2 pr-4">localStorage</td>
                <td className="py-2 pr-4">Authentication — stores your JWT session token</td>
                <td className="py-2">7 days (token expiry)</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4"><code>cookie_consent</code></td>
                <td className="py-2 pr-4">localStorage</td>
                <td className="py-2 pr-4">Remembers your cookie consent preference</td>
                <td className="py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. Categories of Cookies">
        <SubSection title="3.1 Strictly Necessary">
          <p>
            These are essential for the Service to function. The authentication token falls into
            this category. Without it, you cannot remain logged in. Strictly necessary cookies do
            not require consent under most privacy laws.
          </p>
        </SubSection>
        <SubSection title="3.2 Analytics (Not Currently Used)">
          <p>
            We do not currently use third-party analytics cookies (e.g., Google Analytics, Mixpanel).
            If we add analytics in the future, we will update this policy and obtain your consent
            where required.
          </p>
        </SubSection>
        <SubSection title="3.3 Advertising (Not Used)">
          <p>
            We do not use advertising or retargeting cookies. We do not serve ads on PostPilot.
          </p>
        </SubSection>
      </Section>

      <Section title="4. Third-Party Cookies">
        <p>
          PostPilot does not embed third-party trackers, social widgets, or advertising pixels.
          When you connect a social media account via OAuth, the platform's authorization page may
          set its own cookies on its domain — those are governed by the respective platform's cookie
          policy, not ours.
        </p>
      </Section>

      <Section title="5. Managing Cookies">
        <p>You can control cookies and local storage through your browser settings:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>
            <strong>Clear all</strong> — Use your browser's "Clear browsing data" feature.
          </li>
          <li>
            <strong>Block cookies</strong> — Adjust cookie settings in your browser preferences.
            Note that blocking strictly necessary storage may prevent the Service from working.
          </li>
          <li>
            <strong>Delete specific keys</strong> — Open your browser's Developer Tools → Application
            → Local Storage and remove individual entries.
          </li>
        </ul>
      </Section>

      <Section title="6. Do Not Track">
        <p>
          PostPilot respects the Do Not Track (DNT) browser signal. Since we do not use tracking or
          analytics cookies, there is no tracking behavior to disable.
        </p>
      </Section>

      <Section title="7. Updates">
        <p>
          We may update this Cookie Policy when we change our use of cookies or similar technologies.
          Changes will be reflected on this page with an updated effective date.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          For questions about our use of cookies, contact us at{' '}
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
