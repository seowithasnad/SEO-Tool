export function buildCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(",")];
  rows.forEach((r) => lines.push(r.map(escape).join(",")));
  return lines.join("\n");
}

export function keywordResearchToCsv(rows: {
  seedKeyword: string;
  searchVolume: number | null;
  cpc: number | null;
  competition: number | null;
}[]): string {
  return buildCsv(
    ["Keyword", "Search Volume", "CPC", "Competition"],
    rows.map((r) => [r.seedKeyword, r.searchVolume, r.cpc, r.competition])
  );
}

export function siteAuditToCsv(audit: {
  target: string | null;
  brokenLinks: any;
  metaIssues: any;
  headingIssues: any;
  imageIssues: any;
}): string {
  const rows: (string | number | null)[][] = [];
  (audit.brokenLinks ?? []).forEach((r: any) =>
    rows.push([audit.target, "Broken Link", r.url, r.statusCode ?? ""])
  );
  (audit.metaIssues ?? []).forEach((r: any) =>
    rows.push([audit.target, "Meta Issue", r.url, ""])
  );
  (audit.headingIssues ?? []).forEach((r: any) =>
    rows.push([audit.target, "Heading Issue", r.url, ""])
  );
  (audit.imageIssues ?? []).forEach((r: any) =>
    rows.push([audit.target, "Image Missing Alt", r.url, ""])
  );
  return buildCsv(["Target", "Issue Type", "URL", "Detail"], rows);
}
