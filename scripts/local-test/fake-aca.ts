// Local stand-in for an Accela Citizen Access install, for testing the portal worker
// without filing anything with a real building department.
//
// It mimics only what the worker touches: the login page, the disclaimer, the record-type
// list, the address and detail pages, the attachment step, the certification checkbox and
// the receipt page carrying a record number. Control ids follow ACA's generated shape
// (ctl00_PlaceHolderMain_..._LoginName, ..._StreetNo, ..._JobValue) so the worker's
// selectors are exercised as written, not against selectors invented to match it.
//
//   deno run --allow-net --allow-read scripts/local-test/fake-aca.ts
//   PORT=54340 ... (default 54340)
//   ACA_USER / ACA_PASS  — credentials it accepts (default aca-user / aca-pass)
//   ACA_NO_RECORD_NUMBER=1 — return a receipt with no readable record number
//
// It also serves the record-status side used by the Agent 6 poller: a record search, the
// record page carrying "Record Status: ...", and a downloadable corrections letter.
//   ACA_RECORD_NUMBER   — the record the search knows about (default 26BLD-004512)
//   ACA_RECORD_STATUS   — what the record page reports (default "Plan Review")
//   ACA_CORRECTIONS=1   — record page links a plan-review corrections letter
//
// State is a single in-process application, which is all one worker run needs.

const PORT = Number(Deno.env.get("PORT") ?? 54340);
const USER = Deno.env.get("ACA_USER") ?? "aca-user";
const PASS = Deno.env.get("ACA_PASS") ?? "aca-pass";
const NO_RECORD_NUMBER = Deno.env.get("ACA_NO_RECORD_NUMBER") === "1";
const RECORD_NUMBER = Deno.env.get("ACA_RECORD_NUMBER") ?? "26BLD-004512";
const RECORD_STATUS = Deno.env.get("ACA_RECORD_STATUS") ?? "Plan Review";
const CORRECTIONS = Deno.env.get("ACA_CORRECTIONS") === "1";

const submitted: Record<string, unknown> = {};
const uploads: string[] = [];

const page = (title: string, body: string) => `<!doctype html>
<html><head><title>${title}</title></head><body>
<h1>City of Plantation — Citizen Access</h1>
${body}
</body></html>`;

/** ACA drives its wizard with postbacks; a link that submits the form is close enough. */
const continueLink = (label = "Continue Application") =>
  `<a href="#" id="ctl00_PlaceHolderMain_btnContinue" onclick="document.forms[0].submit();return false;">${label} »</a>`;

const routes: Record<string, (form: URLSearchParams) => string> = {
  "/CitizenAccess/Default.aspx": () =>
    page(
      "Home",
      `<a href="/CitizenAccess/Login.aspx" id="ctl00_HeaderNavigation_linkLogin">Login</a>`,
    ),

  "/CitizenAccess/Login.aspx": () =>
    page(
      "Login",
      `<form method="POST" action="/CitizenAccess/Login.aspx">
         <input type="text" id="ctl00_PlaceHolderMain_LoginBox_txtUserId" name="LoginName" />
         <input type="password" id="ctl00_PlaceHolderMain_LoginBox_txtPassword" name="Password" />
         <a href="#" id="ctl00_PlaceHolderMain_LoginBox_btnLogin"
            onclick="document.forms[0].submit();return false;">Login</a>
       </form>`,
    ),
};

function handleLoginPost(form: URLSearchParams): string {
  if (form.get("LoginName") !== USER || form.get("Password") !== PASS) {
    return page("Login", "<div>Invalid login or password.</div>");
  }
  return page("Account", accountBody());
}

/** The logged-in landing page: create an application, or look one up by record number. */
const accountBody = () =>
  `<a href="/CitizenAccess/Create.aspx" id="ctl00_linkCreate">Create an Application</a>
   <form method="POST" action="/CitizenAccess/Search.aspx">
     <input type="text" name="searchNumber"
            id="ctl00_PlaceHolderMain_generalSearchForm_txtGSPermitNumber" />
     <a href="#" id="ctl00_PlaceHolderMain_btnNewSearch"
        onclick="document.forms[0].submit();return false;">Search</a>
   </form>`;

const searchResults = (query: string) =>
  page(
    "Search Results",
    query.trim() && RECORD_NUMBER.toLowerCase().includes(query.trim().toLowerCase())
      ? `<table><tr><td><a href="/CitizenAccess/Record.aspx?id=${RECORD_NUMBER}">${RECORD_NUMBER}</a></td>
           <td>Building Permit</td></tr></table>`
      : `<div>No records found matching your search.</div>`,
  );

const recordPage = () =>
  page(
    "Record",
    `<h2>Record ${RECORD_NUMBER}:</h2>
     <div>Commercial Interior Buildout</div>
     <div>Record Status: ${RECORD_STATUS}</div>
     <div>Date Submitted: 07/25/2026</div>
     ${
       CORRECTIONS
         ? `<a href="/CitizenAccess/CorrectionLetter.pdf"
              id="ctl00_PlaceHolderMain_lnkCorrections">Plan Review Comments (2)</a>`
         : ""
     }`,
  );

// Smallest thing a PDF reader will accept; the poller only stores the bytes.
const CORRECTION_PDF = new TextEncoder().encode(
  "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);

const disclaimer = () =>
  page(
    "Disclaimer",
    `<form method="POST" action="/CitizenAccess/Types.aspx">
       <input type="checkbox" id="ctl00_PlaceHolderMain_refLicenseSelection_chkAgree" name="agree" />
       <label>I have read and accepted the above terms.</label>
       ${continueLink()}
     </form>`,
  );

const recordTypes = () =>
  page(
    "Select a Record Type",
    `<form method="POST" action="/CitizenAccess/Address.aspx">
       <table>
         <tr><td><input type="radio" name="recordType" value="Building Permit" /></td>
             <td>Building Permit</td></tr>
         <tr><td><input type="radio" name="recordType" value="commercial_interior" /></td>
             <td>commercial_interior</td></tr>
         <tr><td><input type="radio" name="recordType" value="Roofing Permit" /></td>
             <td>Roofing Permit</td></tr>
       </table>
       ${continueLink()}
     </form>`,
  );

const addressPage = () =>
  page(
    "Address",
    `<form method="POST" action="/CitizenAccess/Detail.aspx">
       <input type="text" id="ctl00_PlaceHolderMain_addressLine_txtStreetNo" name="StreetNo" />
       <input type="text" id="ctl00_PlaceHolderMain_addressLine_txtStreetName" name="StreetName" />
       ${continueLink()}
     </form>`,
  );

const detailPage = () =>
  page(
    "Detail Information",
    `<form method="POST" action="/CitizenAccess/Attachments.aspx">
       <textarea id="ctl00_PlaceHolderMain_txtDetailInfoDescription" name="Description"></textarea>
       <input type="text" id="ctl00_PlaceHolderMain_txtJobValue" name="JobValue" />
       ${continueLink()}
     </form>`,
  );

const attachmentsPage = () =>
  page(
    "Attachments",
    `<form method="POST" action="/CitizenAccess/Review.aspx" enctype="multipart/form-data">
       <a href="#" id="ctl00_PlaceHolderMain_btnAdd" onclick="return false;">Add</a>
       <input type="file" id="ctl00_PlaceHolderMain_fileUpload" name="file" multiple />
       <ul>${uploads.map((u) => `<li>${u}</li>`).join("")}</ul>
       ${continueLink()}
     </form>`,
  );

const reviewPage = () =>
  page(
    "Review",
    `<form method="POST" action="/CitizenAccess/Receipt.aspx">
       <div>Address: ${submitted.StreetNo ?? ""} ${submitted.StreetName ?? ""}</div>
       <div>Description: ${submitted.Description ?? ""}</div>
       <div>Job value: ${submitted.JobValue ?? ""}</div>
       <div>Attachments: ${uploads.length}</div>
       <input type="checkbox" id="ctl00_PlaceHolderMain_chkCertification" name="certify" />
       <label>By checking this box, I certify the information is true.</label>
       ${continueLink("Submit")}
     </form>`,
  );

const receiptPage = () =>
  page(
    "Receipt",
    NO_RECORD_NUMBER
      ? `<div>Your application has been received and is being processed.</div>`
      : `<div>Your application has been submitted successfully.</div>
         <div>Record Number: 26BLD-004512</div>`,
  );

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);
  const html = (body: string) => new Response(body, { headers: { "Content-Type": "text/html" } });

  if (req.method === "GET") {
    if (url.pathname === "/CitizenAccess/CorrectionLetter.pdf") {
      return new Response(CORRECTION_PDF, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="corrections-26BLD-004512.pdf"',
        },
      });
    }
    if (url.pathname === "/CitizenAccess/Record.aspx") return html(recordPage());
    const route = routes[url.pathname];
    if (route) return html(route(new URLSearchParams()));
    if (url.pathname === "/CitizenAccess/Create.aspx") return html(disclaimer());
    return html(routes["/CitizenAccess/Default.aspx"](new URLSearchParams()));
  }

  const ct = req.headers.get("content-type") ?? "";
  const form = ct.includes("multipart/form-data")
    ? await req.formData()
    : new URLSearchParams(await req.text());
  const get = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : null;
  };
  for (const key of ["StreetNo", "StreetName", "Description", "JobValue", "recordType"]) {
    const v = get(key);
    if (v) submitted[key] = v;
  }
  if (ct.includes("multipart/form-data")) {
    for (const [, v] of (form as FormData).entries()) {
      if (v instanceof File && v.name) uploads.push(v.name);
    }
  }

  switch (url.pathname) {
    case "/CitizenAccess/Login.aspx":
      return html(handleLoginPost(new URLSearchParams([...form].map(([k, v]) => [k, String(v)]))));
    case "/CitizenAccess/Search.aspx":
      return html(searchResults(get("searchNumber") ?? ""));
    case "/CitizenAccess/Types.aspx":
      return html(recordTypes());
    case "/CitizenAccess/Address.aspx":
      return html(addressPage());
    case "/CitizenAccess/Detail.aspx":
      return html(detailPage());
    case "/CitizenAccess/Attachments.aspx":
      return html(attachmentsPage());
    case "/CitizenAccess/Review.aspx":
      return html(reviewPage());
    case "/CitizenAccess/Receipt.aspx":
      console.log("fake-aca received:", { ...submitted, uploads });
      return html(receiptPage());
    default:
      return html(routes["/CitizenAccess/Default.aspx"](new URLSearchParams()));
  }
});

console.log(`fake ACA listening on http://localhost:${PORT}/CitizenAccess/Default.aspx`);
