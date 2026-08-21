import ExcelJS from "exceljs";

const ACCENT = "7C3AED";

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${ACCENT}` },
    };
  });
}

export async function buildKeywordResearchExcel(rows: {
  seedKeyword: string;
  searchVolume: number | null;
  cpc: number | null;
  competition: number | null;
  relatedKeywords: any;
}[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const overview = workbook.addWorksheet("Keyword Overview");

  overview.columns = [
    { header: "Keyword", key: "keyword", width: 30 },
    { header: "Search Volume", key: "volume", width: 16 },
    { header: "CPC", key: "cpc", width: 12 },
    { header: "Competition", key: "competition", width: 14 },
  ];
  styleHeaderRow(overview.getRow(1));

  rows.forEach((r) => {
    overview.addRow({
      keyword: r.seedKeyword,
      volume: r.searchVolume,
      cpc: r.cpc,
      competition: r.competition,
    });
  });

  const related = workbook.addWorksheet("Related Keywords");
  related.columns = [
    { header: "Seed Keyword", key: "seed", width: 24 },
    { header: "Related Keyword", key: "related", width: 30 },
    { header: "Volume", key: "volume", width: 14 },
  ];
  styleHeaderRow(related.getRow(1));

  rows.forEach((r) => {
    const items: any[] = r.relatedKeywords?.[0]?.items ?? [];
    items.forEach((item) => {
      related.addRow({
        seed: r.seedKeyword,
        related: item.keyword_data?.keyword ?? item.keyword,
        volume: item.keyword_data?.keyword_info?.search_volume ?? null,
      });
    });
  });

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function buildCompetitorExcel(competitor: {
  domain: string;
  estTraffic: number | null;
  topKeywords: any;
  topPages: any;
  contentGaps: any;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const overview = workbook.addWorksheet("Overview");
  overview.columns = [
    { header: "Metric", key: "metric", width: 24 },
    { header: "Value", key: "value", width: 24 },
  ];
  styleHeaderRow(overview.getRow(1));
  overview.addRow({ metric: "Domain", value: competitor.domain });
  overview.addRow({ metric: "Est. Organic Traffic", value: competitor.estTraffic });

  const keywords = workbook.addWorksheet("Top Keywords");
  keywords.columns = [
    { header: "Keyword", key: "keyword", width: 30 },
    { header: "Position", key: "position", width: 12 },
    { header: "Volume", key: "volume", width: 14 },
  ];
  styleHeaderRow(keywords.getRow(1));
  (competitor.topKeywords ?? []).forEach((kw: any) => {
    keywords.addRow({
      keyword: kw.keyword_data?.keyword ?? kw.keyword,
      position: kw.ranked_serp_element?.serp_item?.rank_absolute ?? null,
      volume: kw.keyword_data?.keyword_info?.search_volume ?? null,
    });
  });

  const pages = workbook.addWorksheet("Top Pages");
  pages.columns = [
    { header: "URL", key: "url", width: 50 },
    { header: "Est. Traffic", key: "traffic", width: 16 },
  ];
  styleHeaderRow(pages.getRow(1));
  (competitor.topPages ?? []).forEach((p: any) => {
    pages.addRow({
      url: p.page_address ?? p.url,
      traffic: p.metrics?.organic?.etv ? Math.round(p.metrics.organic.etv) : null,
    });
  });

  const gaps = workbook.addWorksheet("Content Gap");
  gaps.columns = [
    { header: "Keyword", key: "keyword", width: 30 },
    { header: "Your Position", key: "yourPos", width: 16 },
    { header: "Competitor Position", key: "compPos", width: 20 },
  ];
  styleHeaderRow(gaps.getRow(1));
  (competitor.contentGaps ?? []).forEach((g: any) => {
    gaps.addRow({
      keyword: g.keyword_data?.keyword ?? g.keyword,
      yourPos: g.first_domain_serp_element?.rank_absolute ?? null,
      compPos: g.second_domain_serp_element?.rank_absolute ?? null,
    });
  });

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function buildSiteAuditExcel(audit: {
  target: string | null;
  issuesSummary: any;
  brokenLinks: any;
  metaIssues: any;
  headingIssues: any;
  imageIssues: any;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric", key: "metric", width: 24 },
    { header: "Value", key: "value", width: 20 },
  ];
  styleHeaderRow(summary.getRow(1));
  const s = audit.issuesSummary ?? {};
  summary.addRow({ metric: "Target", value: audit.target });
  summary.addRow({ metric: "Pages Crawled", value: s.pagesCrawled });
  summary.addRow({ metric: "Broken Links", value: s.brokenLinksCount });
  summary.addRow({ metric: "Meta Issues", value: s.metaIssuesCount });
  summary.addRow({ metric: "Heading Issues", value: s.headingIssuesCount });
  summary.addRow({ metric: "Images Missing Alt", value: s.imageIssuesCount });

  const addUrlSheet = (name: string, rows: any[]) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = [{ header: "URL", key: "url", width: 60 }];
    styleHeaderRow(sheet.getRow(1));
    (rows ?? []).forEach((r) => sheet.addRow({ url: r.url }));
  };

  addUrlSheet("Broken Links", audit.brokenLinks);
  addUrlSheet("Meta Issues", audit.metaIssues);
  addUrlSheet("Heading Issues", audit.headingIssues);
  addUrlSheet("Images Missing Alt", audit.imageIssues);

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
