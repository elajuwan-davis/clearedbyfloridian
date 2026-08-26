import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { LegalDoc } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Cleard" },
      {
        name: "description",
        content:
          "The Terms of Service governing services provided by Cleard and Flōridian — scope, pricing, payment, change orders, warranties, and dispute resolution.",
      },
      { property: "og:title", content: "Terms of Service — Cleard" },
      {
        property: "og:description",
        content: "The Terms of Service governing services provided by Cleard and Flōridian.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <MarketingShell>
      <LegalDoc eyebrow="Legal" title="Terms of Service" updated="Last updated: June 1, 2025">
        <p>
          These <strong>Terms of Service (“Terms”)</strong> govern all design, construction,
          remodeling, outdoor living, landscaping, pool, hardscaping, and related services
          (“Services”) provided by Floridian (“Contractor,” “we,” or “us”) to the client (“Client”
          or “you”). By signing any proposal, agreement, or change order with Floridian, you agree
          to be bound by these Terms.
        </p>

        <h2>1. Scope of Services</h2>
        <p>
          Floridian provides a broad range of services, including but not limited to: design-only
          services; construction and build services; outdoor remodeling; 3D design and
          visualization; landscaping and hardscaping; pool design and pool construction; outdoor
          living features such as kitchens and pergolas; maintenance services; and any additional
          services described in a signed proposal or change order. The specific services to be
          provided for each project will be detailed in the written agreement between the parties.
        </p>

        <h2>2. Proposals and Pricing</h2>
        <p>
          All pricing is based on information available at the time the proposal is issued. Floridian
          may revise pricing if material costs change, site conditions differ from those
          represented, suppliers or vendors adjust pricing or availability, or the scope of work
          changes at the Client’s request or due to project conditions. Any revision to pricing or
          scope will be documented through a written change order signed by both parties.
        </p>

        <h2>3. Deposits</h2>
        <p>
          All deposits paid to Floridian are non-refundable and are applied toward the total project
          cost. Deposits compensate Floridian for reserving labor and scheduling resources,
          conducting pre-construction planning, preparing designs, and incurring opportunity costs.
          No deposit shall be refunded unless Floridian elects to cancel the project at its sole
          discretion.
        </p>

        <h2>4. Payment Terms</h2>
        <p>
          Unless otherwise stated in writing, all invoices are due upon receipt. Overdue amounts may
          incur a monthly late fee of the greater of: (a) the percentage stated in the project
          agreement or (b) the maximum rate permitted under Florida law. If payment is not received
          within five (5) days of the invoice date, Floridian may suspend work until the balance is
          paid in full. The Client is responsible for all costs of collection, including reasonable
          attorney’s fees.
        </p>

        <h2>5. Change Orders</h2>
        <p>
          Any modification to the design, scope, materials, features, dimensions, or labor must be
          documented in a written change order signed by both parties. Verbal requests, text
          messages, or field instructions are not binding unless incorporated into a signed change
          order. Change orders may affect pricing, scheduling, or project duration.
        </p>

        <h2>6. Client Responsibilities</h2>
        <p>
          The Client shall provide Floridian with reasonable access to the property during standard
          working hours; supply utilities such as water and electricity as needed for the
          performance of Services; obtain any required homeowners association approvals; disclose
          all known underground utilities and site hazards; and ensure that the jobsite remains safe
          and accessible. Floridian shall not be liable for delays or damages resulting from
          undisclosed conditions or restricted access.
        </p>

        <h2>7. Ownership of Designs and Intellectual Property</h2>
        <p>
          All designs, renderings, drawings, plans, and visual materials created by Floridian are and
          shall remain the exclusive intellectual property of Floridian, Inc. Such materials may not
          be shared with or used by any third party without Floridian’s prior written consent. The
          Client receives a limited license to use the designs solely for the project described in
          the agreement, and only after all outstanding invoices have been paid in full. Ownership of
          the designs does not transfer until payment is complete.
        </p>

        <h2>8. Marketing and Media Rights</h2>
        <p>
          The Client grants Floridian permission to photograph or record the project before, during,
          and after completion and to use such media for marketing, promotional, and portfolio
          purposes. Floridian will not disclose personal identifying information in connection with
          such use.
        </p>

        <h2>9. Project Timeline</h2>
        <p>
          Any timeline provided by Floridian is an estimate and not a guarantee. Delays may occur due
          to weather, supplier or vendor delays, permitting delays, material shortages, labor
          shortages, change orders, or unforeseen site conditions. Floridian shall not be held liable
          for delays outside its reasonable control.
        </p>

        <h2>10. Warranties and Disclaimers</h2>
        <p>
          Floridian warrants its workmanship as described in the project agreement. Floridian does
          not warrant natural settling or soil movement, weather-related damage, landscaping failure,
          misuse, neglect, acts of God, or damage caused by third parties or other contractors.
          Manufacturer warranties apply to equipment or materials supplied by manufacturers.
        </p>

        <h2>11. Termination</h2>
        <h3>11.1 Termination for Cause</h3>
        <p>
          Either party may terminate the agreement if the other party materially breaches the
          agreement and fails to cure such breach within five (5) business days after receiving
          written notice.
        </p>
        <h3>11.2 Client-Initiated Termination</h3>
        <p>
          The Client may request cancellation of the project at any time by providing written notice.
          Cancellation becomes effective only when Floridian acknowledges the request in writing and
          both parties execute a written cancellation change order. If the Client cancels for any
          reason other than Floridian’s material breach, the Client shall: (a) forfeit the deposit;
          (b) pay a termination fee equal to twenty-five percent (25%) of the total contract price,
          including all signed change orders as of the cancellation date; and (c) pay for all work
          performed, materials purchased, and costs incurred through the effective cancellation date.
          All amounts owed become immediately due upon execution of the cancellation change order.
        </p>
        <h3>11.3 Contractor-Initiated Termination</h3>
        <p>
          Floridian may terminate the agreement for cause if the Client fails to pay amounts when
          due, in which case all outstanding amounts become immediately due. Floridian may cease work
          and secure the site as reasonably necessary. No refunds will be issued for payments
          previously made.
        </p>

        <h2>12. Refund Policy</h2>
        <p>
          Except as required by law: (a) deposits are non-refundable; (b) no refunds shall be issued
          for design work once delivered; (c) no refunds shall be issued for labor performed or
          materials installed; and (d) no refunds shall be issued after cancellation.
        </p>

        <h2>13. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by Florida law, Floridian’s total aggregate liability to
          the Client shall not exceed the amount paid by the Client under the agreement. Floridian
          shall not be liable for incidental, consequential, punitive, exemplary, or special damages.
          The Client agrees to indemnify and hold Floridian harmless from claims arising out of
          Client actions, site conditions, or third-party interference.
        </p>

        <h2>14. Dispute Resolution and Arbitration</h2>
        <p>
          Any dispute arising under these Terms or related to the project shall be resolved through
          binding arbitration in Palm Beach County, Florida, administered by the American
          Arbitration Association (“AAA”). Each party shall bear its own legal costs unless otherwise
          awarded by the arbitrator.
        </p>

        <h2>15. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed under the laws of the State of Florida.
          Venue for any permitted legal action shall lie exclusively in Palm Beach County, Florida.
        </p>

        <h2>16. Entire Agreement</h2>
        <p>
          These Terms, together with any signed proposal, agreement, invoice, or change order,
          constitute the entire agreement between the parties and supersede all prior understandings
          or representations.
        </p>

        <hr />
        <p>
          Cleard is operated by Flōridian, Inc. Questions about these Terms? Email{" "}
          <a href="mailto:info@floridianinc.com">info@floridianinc.com</a>.
        </p>
      </LegalDoc>
    </MarketingShell>
  );
}
