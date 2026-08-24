import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { LegalDoc } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Cleard" },
      {
        name: "description",
        content:
          "How Cleard collects, uses, and protects your data — including analytics, cookies, SMS consent, and how to opt out.",
      },
      { property: "og:title", content: "Privacy Policy — Cleard" },
      {
        property: "og:description",
        content: "How Cleard collects, uses, and protects your data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MarketingShell>
      <LegalDoc eyebrow="Legal" title="Privacy Policy" updated="Last updated: June 1, 2025">
        <p>
          Your privacy is critically important to us. As such, we have a few fundamental
          principles:
        </p>
        <ul>
          <li>
            We do not, and will not, sell any of your data to any third party for marketing
            purposes, including your name, address, email address, or card information.
          </li>
          <li>
            We don’t share your personal information with anyone except to comply with the law,
            develop our products, or protect our rights.
          </li>
          <li>
            We will not contact you for any purposes other than to provide information on our
            products and services.
          </li>
        </ul>
        <p>
          These policies are subject to any change at any time without notice. Please review these
          policies for any changes. By using SMS after any changes, you consent and agree to the
          revised policies.
        </p>

        <h2>Information we collect</h2>
        <p>This website collects personal data to power our site analytics, including:</p>
        <ul>
          <li>Information about your browser, network, and device</li>
          <li>Web pages you visited prior to coming to this website</li>
          <li>Your IP address</li>
        </ul>
        <p>This information may also include details about your use of this website, including:</p>
        <ul>
          <li>Clicks</li>
          <li>Internal links</li>
          <li>Pages visited</li>
          <li>Scrolling</li>
          <li>Searches</li>
          <li>Timestamps</li>
        </ul>
        <p>
          We share this information with our website analytics provider to learn about site traffic
          and activity.
        </p>

        <h2>Cookies</h2>
        <p>
          This website uses cookies and similar technologies, which are small files or pieces of
          text that download to a device when a visitor accesses a website or app.
        </p>
        <p>
          <strong>Functional and required cookies are always used</strong>, which allows our hosting
          platform to securely serve this website to you.
        </p>
        <p>
          <strong>Analytics and performance cookies</strong> are used on this website, as described
          below, only when you acknowledge our cookie banner. This website uses analytics and
          performance cookies to view site traffic, activity, and other data.
        </p>

        <h2>Comments and likes</h2>
        <p>
          This website includes commenting functionality on some pages which enables you to post a
          comment. This website collects personal data when you post a comment, including:
        </p>
        <ul>
          <li>Your name (which will be displayed as part of your posted comment)</li>
          <li>Your email address (optional, to let you know if someone replies to your comment)</li>
          <li>Your website URL (optional)</li>
        </ul>
        <p>
          This website includes “likes” functionality on some blog posts which enables you to “like”
          a post. This website collects personal data when you like a post to try to prevent the
          same person from liking the same post during the same visit, including:
        </p>
        <ul>
          <li>Information about your browser, network, and device</li>
          <li>Details about the web page or content you shared or proposed to share</li>
          <li>Your IP address</li>
        </ul>

        <h2>Opt-out / unsubscribe</h2>
        <p>
          To opt-out or unsubscribe, email{" "}
          <a href="mailto:info@floridianinc.com">info@floridianinc.com</a> or call{" "}
          <a href="tel:+15616937931">(561) 693-7931</a>.
        </p>

        <h2>SMS opt-in consent</h2>
        <p>
          On Flōridian’s contact forms where a phone number is requested, there is a consent
          checkbox with the following statement: “By entering your phone number, you are consenting
          to receive text messages from Flōridian. Message rates may apply.”
        </p>
        <p>
          By checking this box, you are providing express consent to receive SMS messages from
          Flōridian for various purposes, including but not limited to updates, alerts, promotions,
          and other communications.
        </p>
        <p>This consent is in compliance with the CTIA guidelines and RingCentral’s policies.</p>
        <p>
          Flōridian ensures that each SMS campaign or message type sent to you has received your
          express prior written consent.
        </p>

        <h2>SMS opt-out process</h2>
        <p>You can opt-out of receiving SMS messages from Flōridian at any time.</p>
        <p>
          To opt-out, simply reply to any of our messages with the word “STOP” or “UNSUBSCRIBE.”
        </p>
        <p>Upon receiving your opt-out request, Flōridian will cease sending SMS messages to you.</p>
        <p>
          Flōridian is responsible for managing and tracking opt-out requests to ensure that no
          further messages are sent to users who have opted out, in accordance with CTIA guidelines
          and RingCentral’s requirements.
        </p>

        <hr />
        <p>
          Cleard is operated by Flōridian, Inc. Questions about this policy? Email{" "}
          <a href="mailto:info@floridianinc.com">info@floridianinc.com</a>.
        </p>
      </LegalDoc>
    </MarketingShell>
  );
}
