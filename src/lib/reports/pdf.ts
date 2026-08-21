import PDFDocument from "pdfkit";

export interface ReportBranding {
  whiteLabel: boolean;
  agencyName?: string;
  clientName?: string;
}

// Purple accent, matching the dashboard's brand color — swap for a client's
// brand color when whiteLabel is true and they've supplied one.
const ACCENT = "#7c3aed";

function addHeader(doc: PDFKit.PDFDocument, title: string, branding: ReportBranding) {
  doc.fontSize(20).fillColor(ACCENT).text(
    branding.whiteLabel && branding.agencyName ? branding.agencyName : "SEO Platform",
    { continued: false }
  );
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor("#111111").text(title);
  if (branding.clientName) {
    doc.fontSize(10).fillColor("#555555").text(`Prepared for ${branding.clientName}`);
  }
  doc.fontSize(9).fillColor("#888888").text(new Date().toLocaleDateString());
  doc.moveDown(1);
  doc.strokeColor("#dddddd").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
}

function addSection(doc: PDFKit.PDFDocument, heading: string) {
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor(ACCENT).text(heading);
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#222222");
}

function addBulletList(doc: PDFKit.PDFDocument, items: string[]) {
  items.forEach((item) => doc.text(`•  ${item}`, { indent: 10 }));
}

export function buildSerpAnalysisPdf(
  data: {
    keyword: string;
    hasAiOverview: boolean;
    hasFeaturedSnippet: boolean;
    peopleAlsoAsk: string[];
    aiAnalysis: any;
  },
  branding: ReportBranding
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addHeader(doc, `SERP Analysis — "${data.keyword}"`, branding);

    addSection(doc, "SERP Features");
    doc.text(`AI Overview: ${data.hasAiOverview ? "Present" : "Not present"}`);
    doc.text(
      `Featured Snippet: ${data.hasFeaturedSnippet ? "Present" : "Not present"}`
    );

    if (data.peopleAlsoAsk?.length) {
      addSection(doc, "People Also Ask");
      addBulletList(doc, data.peopleAlsoAsk);
    }

    if (data.aiAnalysis) {
      const a = data.aiAnalysis;
      addSection(doc, "Search Intent");
      doc.text(a.searchIntent ?? "—");

      addSection(doc, "Scores");
      doc.text(`Content Score: ${a.contentScore ?? "—"}`);
      doc.text(`SEO Score: ${a.seoScore ?? "—"}`);
      doc.text(`AI Search Score: ${a.aiSearchScore ?? "—"}`);
      doc.text(`Google AI Mode Score: ${a.googleAiModeScore ?? "—"}`);
      doc.text(`LLM Score: ${a.llmScore ?? "—"}`);

      if (a.contentGaps?.length) {
        addSection(doc, "Content Gaps");
        addBulletList(doc, a.contentGaps);
      }
      if (a.missingFaqs?.length) {
        addSection(doc, "Missing FAQs");
        addBulletList(doc, a.missingFaqs);
      }
      if (a.eeatOpportunities?.length) {
        addSection(doc, "EEAT Opportunities");
        addBulletList(doc, a.eeatOpportunities);
      }
    }

    doc.end();
  });
}

export function buildContentBriefPdf(
  data: {
    targetKeyword: string;
    outline: any;
    schema: any;
    internalLinks: any;
    seoScore: number | null;
    eeatScore: number | null;
    aiSearchVisibilityScore: number | null;
  },
  branding: ReportBranding
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addHeader(doc, `Content Brief — "${data.targetKeyword}"`, branding);

    addSection(doc, "Scores");
    doc.text(`SEO Score: ${data.seoScore ?? "—"}`);
    doc.text(`EEAT Score: ${data.eeatScore ?? "—"}`);
    doc.text(`AI Search Visibility: ${data.aiSearchVisibilityScore ?? "—"}`);

    if (data.outline) {
      addSection(doc, "Outline");
      doc.fontSize(11).fillColor("#111111").text(data.outline.h1 ?? "");
      doc.fontSize(10).fillColor("#222222");
      (data.outline.sections ?? []).forEach((s: any) => {
        doc.moveDown(0.2);
        doc.text(s.h2, { indent: 10 });
        (s.h3s ?? []).forEach((h3: string) => doc.text(`- ${h3}`, { indent: 20 }));
      });
    }

    if (data.internalLinks?.length) {
      addSection(doc, "Internal Link Ideas");
      addBulletList(doc, data.internalLinks);
    }

    if (data.schema?.length) {
      addSection(doc, "Suggested Schema");
      addBulletList(doc, data.schema.map((s: any) => `${s.type} — ${s.notes}`));
    }

    doc.end();
  });
}

export function buildSiteAuditPdf(
  data: {
    target: string | null;
    issuesSummary: any;
  },
  branding: ReportBranding
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addHeader(doc, `Site Audit — ${data.target ?? ""}`, branding);

    const s = data.issuesSummary ?? {};
    addSection(doc, "Summary");
    doc.text(`Pages Crawled: ${s.pagesCrawled ?? "—"}`);
    doc.text(`Broken Links: ${s.brokenLinksCount ?? "—"}`);
    doc.text(`Meta Issues: ${s.metaIssuesCount ?? "—"}`);
    doc.text(`Heading Issues: ${s.headingIssuesCount ?? "—"}`);
    doc.text(`Images Missing Alt: ${s.imageIssuesCount ?? "—"}`);

    doc.end();
  });
}
