import PptxGenJS from "pptxgenjs";
import type { ReportBranding } from "./pdf";

const ACCENT = "7C3AED";
const DARK = "111111";

function addTitleSlide(
  pptx: PptxGenJS,
  title: string,
  branding: ReportBranding
) {
  const slide = pptx.addSlide();
  slide.background = { color: "0A0A0A" };
  slide.addText(
    branding.whiteLabel && branding.agencyName ? branding.agencyName : "SEO Platform",
    { x: 0.5, y: 0.4, fontSize: 14, color: ACCENT, bold: true }
  );
  slide.addText(title, {
    x: 0.5,
    y: 2.2,
    w: 9,
    fontSize: 30,
    color: "FFFFFF",
    bold: true,
  });
  if (branding.clientName) {
    slide.addText(`Prepared for ${branding.clientName}`, {
      x: 0.5,
      y: 3.1,
      fontSize: 14,
      color: "AAAAAA",
    });
  }
  slide.addText(new Date().toLocaleDateString(), {
    x: 0.5,
    y: 3.5,
    fontSize: 11,
    color: "777777",
  });
}

function addBulletSlide(pptx: PptxGenJS, heading: string, bullets: string[]) {
  if (!bullets?.length) return;
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addText(heading, { x: 0.5, y: 0.4, fontSize: 22, color: ACCENT, bold: true });
  slide.addText(
    bullets.slice(0, 8).map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
    { x: 0.5, y: 1.2, w: 9, h: 4.5, fontSize: 14, color: DARK }
  );
}

function addScoreSlide(pptx: PptxGenJS, scores: { label: string; value: number | string }[]) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addText("Scores", { x: 0.5, y: 0.4, fontSize: 22, color: ACCENT, bold: true });

  const cellW = 9 / scores.length;
  scores.forEach((s, i) => {
    slide.addText(String(s.value), {
      x: 0.5 + i * cellW,
      y: 1.5,
      w: cellW,
      fontSize: 32,
      color: ACCENT,
      bold: true,
      align: "center",
    });
    slide.addText(s.label, {
      x: 0.5 + i * cellW,
      y: 2.3,
      w: cellW,
      fontSize: 11,
      color: DARK,
      align: "center",
    });
  });
}

export async function buildSerpAnalysisPptx(
  data: {
    keyword: string;
    aiAnalysis: any;
  },
  branding: ReportBranding
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  addTitleSlide(pptx, `SERP Analysis — "${data.keyword}"`, branding);

  const a = data.aiAnalysis ?? {};
  addScoreSlide(pptx, [
    { label: "Content Score", value: a.contentScore ?? "—" },
    { label: "SEO Score", value: a.seoScore ?? "—" },
    { label: "AI Search Score", value: a.aiSearchScore ?? "—" },
    { label: "LLM Score", value: a.llmScore ?? "—" },
  ]);
  addBulletSlide(pptx, "Content Gaps", a.contentGaps ?? []);
  addBulletSlide(pptx, "Missing FAQs", a.missingFaqs ?? []);
  addBulletSlide(pptx, "EEAT Opportunities", a.eeatOpportunities ?? []);

  const buf = await pptx.write({ outputType: "nodebuffer" });
  return buf as Buffer;
}

export async function buildContentBriefPptx(
  data: {
    targetKeyword: string;
    outline: any;
    seoScore: number | null;
    eeatScore: number | null;
    aiSearchVisibilityScore: number | null;
  },
  branding: ReportBranding
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  addTitleSlide(pptx, `Content Brief — "${data.targetKeyword}"`, branding);

  addScoreSlide(pptx, [
    { label: "SEO Score", value: data.seoScore ?? "—" },
    { label: "EEAT Score", value: data.eeatScore ?? "—" },
    { label: "AI Search Visibility", value: data.aiSearchVisibilityScore ?? "—" },
  ]);

  if (data.outline) {
    const h2s = (data.outline.sections ?? []).map((s: any) => s.h2);
    addBulletSlide(pptx, data.outline.h1 ?? "Outline", h2s);
  }

  const buf = await pptx.write({ outputType: "nodebuffer" });
  return buf as Buffer;
}
