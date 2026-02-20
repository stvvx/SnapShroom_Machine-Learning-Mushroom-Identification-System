/* ═══════════════════════════════════════════════════════════════
   SnapShroom  ·  Formal PDF Report Generator
   ───────────────────────────────────────────────────────────────
   Generates professional A4 report HTML for expo-print.
   FIXED: Proper A4 page sizing and print-specific CSS
═══════════════════════════════════════════════════════════════ */

/* ─── colour palette ─── */
const C = {
  ink:     '#0F1A0F',
  forest:  '#1E3020',
  green:   '#2D4A2D',
  moss:    '#3A5C3A',
  sage:    '#5A7A5A',
  mist:    '#E8F0E8',
  teal:    '#2BA8A0',
  tealLt:  '#D6F0EE',
  red:     '#C0392B',
  redLt:   '#FADBD8',
  amber:   '#D68910',
  amberLt: '#FEF9E7',
  rule:    '#C8D8C8',
  bg:      '#F7FAF7',
  white:   '#FFFFFF',
  mid:     '#6B7C6B',
  light:   '#A8B8A8',
};

/* ─── helpers ─── */
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
};

const pct = (n: number, total: number) =>
  total > 0 ? ((n / total) * 100).toFixed(1) + '%' : '0%';

const barW = (n: number, max: number) =>
  max > 0 ? Math.max(2, Math.round((n / max) * 100)) : 2;

const medal = (i: number) =>
  i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

/* ════════════════════════════════════════════════════════════════
   SHARED CSS — FIXED FOR PROPER PDF PRINTING
════════════════════════════════════════════════════════════════ */
const BASE_CSS = `
  /* Critical print styles */
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }

  /* Base styles for both screen and print */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    width: 100%;
    background: ${C.white};
    font-family: Helvetica, Arial, sans-serif;
    font-size: 10pt;
    color: ${C.ink};
    line-height: 1.4;
  }

  /* Page container */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    margin: 0 auto;
    background: ${C.white};
    position: relative;
    page-break-after: always;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }

  @media print {
    .page {
      box-shadow: none;
      margin: 0;
      padding: 20mm;
    }
  }

  /* Cover page */
  .cover {
    width: 210mm;
    min-height: 297mm;
    background-color: ${C.forest};
    position: relative;
    page-break-after: always;
    padding: 20mm;
  }

  .cover-top-bar {
    background-color: ${C.moss};
    height: 8mm;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .cover-accent-bar {
    background-color: ${C.teal};
    width: 16mm;
    height: 297mm;
    position: absolute;
    top: 0;
    right: 0;
  }

  .cover-logo {
    font-size: 10pt;
    font-weight: bold;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${C.teal};
    border-left: 3px solid ${C.teal};
    padding-left: 8px;
    margin-bottom: 40mm;
  }

  .cover-eyebrow {
    font-size: 7.5pt;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: ${C.light};
    margin-bottom: 5mm;
  }

  .cover-title {
    font-size: 26pt;
    font-weight: bold;
    color: ${C.white};
    line-height: 1.25;
    margin-bottom: 5mm;
    max-width: 120mm;
  }

  .cover-subtitle {
    font-size: 11pt;
    color: ${C.light};
    margin-bottom: 14mm;
    max-width: 110mm;
    line-height: 1.5;
  }

  .cover-divider {
    width: 22mm;
    height: 2px;
    background-color: ${C.teal};
    margin-bottom: 8mm;
  }

  .cover-meta-table {
    border-collapse: collapse;
    margin-top: 30mm;
    width: 100%;
  }

  .cover-meta-table td {
    padding: 2mm 0;
  }

  .cover-meta-label {
    font-size: 7pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${C.light};
    padding-right: 12mm;
    vertical-align: top;
  }

  .cover-meta-value {
    font-size: 9pt;
    color: ${C.white};
    font-weight: bold;
  }

  .cover-classification {
    margin-top: 8mm;
    display: inline-block;
    border: 1px solid ${C.red};
    color: ${C.red};
    font-size: 7pt;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 2mm 4mm;
    font-weight: bold;
  }

  /* Header and Footer */
  .page-header {
    border-bottom: 1.5pt solid ${C.forest};
    padding-bottom: 2.5mm;
    margin-bottom: 7mm;
    display: flex;
    justify-content: space-between;
  }

  .page-header-left {
    font-size: 7pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${C.sage};
    font-weight: bold;
  }

  .page-header-right {
    font-size: 7pt;
    color: ${C.light};
  }

  .page-footer {
    border-top: 0.5pt solid ${C.rule};
    padding-top: 3mm;
    margin-top: 10mm;
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    color: ${C.light};
  }

  .conf-strip {
    background-color: ${C.redLt};
    border-top: 1pt solid ${C.red};
    text-align: center;
    font-size: 6.5pt;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${C.red};
    font-weight: bold;
    padding: 1.5mm 0;
    margin-top: 5mm;
  }

  /* TOC */
  .toc-title {
    font-size: 17pt;
    font-weight: bold;
    color: ${C.forest};
    margin-bottom: 7mm;
    padding-bottom: 2.5mm;
    border-bottom: 2pt solid ${C.teal};
  }

  .toc-table {
    width: 100%;
    border-collapse: collapse;
  }

  .toc-table td {
    padding: 3mm 0;
    border-bottom: 0.5pt dotted ${C.rule};
    vertical-align: middle;
  }

  .toc-num {
    font-size: 8pt;
    font-weight: bold;
    color: ${C.teal};
    width: 9mm;
  }

  .toc-label {
    font-size: 10pt;
    color: ${C.ink};
  }

  /* Section headings */
  .section-heading {
    display: flex;
    align-items: center;
    margin-bottom: 3mm;
  }

  .section-num {
    font-size: 8pt;
    font-weight: bold;
    color: ${C.teal};
    letter-spacing: 1px;
    width: 10mm;
  }

  .section-title {
    font-size: 14pt;
    font-weight: bold;
    color: ${C.forest};
  }

  .section-rule {
    height: 2pt;
    background-color: ${C.teal};
    margin-bottom: 5mm;
    width: 100%;
  }

  .subsection-title {
    font-size: 9.5pt;
    font-weight: bold;
    color: ${C.moss};
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 5mm 0 2.5mm;
  }

  /* Executive summary */
  .exec-box {
    background-color: ${C.mist};
    border-left: 4pt solid ${C.teal};
    padding: 4.5mm 5.5mm;
    margin-bottom: 6mm;
  }

  .exec-label {
    font-size: 7pt;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${C.teal};
    font-weight: bold;
    margin-bottom: 2mm;
  }

  .exec-text {
    font-size: 9.5pt;
    line-height: 1.65;
    color: ${C.ink};
  }

  /* KPI cards */
  .kpi-grid {
    display: flex;
    gap: 3mm;
    margin-bottom: 5mm;
    flex-wrap: wrap;
  }

  .kpi-card {
    flex: 1;
    min-width: 60mm;
    background-color: ${C.bg};
    border: 0.5pt solid ${C.rule};
    border-top: 3pt solid ${C.sage};
    padding: 4mm 3mm;
    text-align: center;
  }

  .kpi-card.teal { border-top-color: ${C.teal}; }
  .kpi-card.red { border-top-color: ${C.red}; }
  .kpi-card.amber { border-top-color: ${C.amber}; }

  .kpi-value {
    font-size: 17pt;
    font-weight: bold;
    color: ${C.forest};
    line-height: 1;
    margin-bottom: 1mm;
    display: block;
  }

  .kpi-label {
    font-size: 6.5pt;
    color: ${C.mid};
    text-transform: uppercase;
    letter-spacing: 1px;
    display: block;
  }

  .kpi-delta {
    font-size: 7.5pt;
    color: ${C.teal};
    font-weight: bold;
    margin-top: 1mm;
    display: block;
  }

  /* Distribution bars */
  .dist-item {
    display: flex;
    align-items: center;
    margin-bottom: 2mm;
  }

  .dist-label {
    width: 32mm;
    font-size: 8.5pt;
    font-weight: bold;
  }

  .dist-track {
    flex: 1;
    height: 5mm;
    background-color: ${C.mist};
    margin: 0 3mm;
  }

  .dist-fill {
    height: 5mm;
    background-color: ${C.sage};
  }

  .dist-value {
    width: 26mm;
    text-align: right;
    font-size: 8pt;
    color: ${C.mid};
  }

  /* Ranked lists */
  .rank-item {
    display: flex;
    align-items: center;
    padding: 2.5mm 0;
    border-bottom: 0.5pt solid ${C.mist};
  }

  .rank-medal {
    width: 9mm;
    font-size: 11pt;
    text-align: center;
  }

  .rank-name {
    flex: 1;
    font-size: 9pt;
    font-weight: bold;
    padding-right: 3mm;
  }

  .rank-bar {
    width: 36mm;
    height: 3.5mm;
    background-color: ${C.mist};
    margin: 0 2mm;
  }

  .rank-bar-fill {
    height: 3.5mm;
    background-color: ${C.sage};
  }

  .rank-count {
    width: 18mm;
    text-align: right;
    font-size: 8.5pt;
    font-weight: bold;
  }

  .rank-pct {
    width: 14mm;
    text-align: right;
    font-size: 7.5pt;
    color: ${C.light};
  }

  /* Data tables */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 3mm 0 5mm;
    font-size: 8.5pt;
  }

  .data-table th {
    background-color: ${C.forest};
    padding: 2.5mm 3mm;
    text-align: left;
    font-size: 7.5pt;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: bold;
    color: ${C.white};
  }

  .data-table td {
    padding: 2mm 3mm;
    border-bottom: 0.5pt solid ${C.rule};
  }

  .data-table tr:nth-child(even) td {
    background-color: ${C.bg};
  }

  .data-table .right {
    text-align: right;
  }

  .data-table tfoot td {
    background-color: ${C.mist};
    font-weight: bold;
    border-top: 1.5pt solid ${C.sage};
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 0.8mm 2.5mm;
    font-size: 6.5pt;
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .badge-active {
    background-color: #D5F5E3;
    color: #1E8449;
  }

  .badge-inactive {
    background-color: ${C.redLt};
    color: ${C.red};
  }

  .badge-admin {
    background-color: ${C.mist};
    color: ${C.moss};
    border: 0.5pt solid ${C.sage};
  }

  .badge-user {
    background-color: ${C.tealLt};
    color: ${C.teal};
  }

  /* Two column layout */
  .two-col {
    display: flex;
    gap: 5mm;
    margin-bottom: 3mm;
  }

  .col {
    flex: 1;
  }

  /* Sparkline */
  .sparkline-container {
    width: 100%;
    height: 16mm;
    background-color: ${C.bg};
    border: 0.5pt solid ${C.rule};
    padding: 1mm;
    margin: 2mm 0;
    display: flex;
    align-items: flex-end;
    gap: 1px;
  }

  .spark-bar {
    flex: 1;
    background-color: ${C.teal};
    min-height: 2px;
  }

  /* Callout */
  .callout {
    border: 1pt solid ${C.amber};
    background-color: ${C.amberLt};
    border-left: 4pt solid ${C.amber};
    padding: 3mm 4mm;
    margin: 4mm 0;
  }

  .callout-label {
    font-size: 7pt;
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${C.amber};
    margin-bottom: 1mm;
  }

  .callout-text {
    font-size: 8.5pt;
    line-height: 1.5;
  }

  /* Utility classes */
  .mono {
    font-family: 'Courier New', Courier, monospace;
  }
`;

/* ════════════════════════════════════════════════════════════════
   PAGE SHELL FUNCTIONS
════════════════════════════════════════════════════════════════ */

const pageShell = (reportTitle: string, sectionName: string, pageNum: number, content: string) => `
<div class="page">
  <div class="page-header">
    <span class="page-header-left">SnapShroom Admin Portal</span>
    <span class="page-header-right">${reportTitle}</span>
  </div>

  ${content}

  <div class="page-footer">
    <span>CONFIDENTIAL — Internal Use Only</span>
    <span>${sectionName}</span>
    <span>Page ${pageNum}</span>
  </div>
  <div class="conf-strip">Confidential · SnapShroom Internal Report · Do Not Distribute</div>
</div>`;

const coverPage = (title: string, subtitle: string, generatedAt: string, preparedBy: string) => `
<div class="cover">
  <div class="cover-accent-bar"></div>
  <div class="cover-top-bar"></div>
  <div class="cover-logo">🍄 SnapShroom</div>
  <div class="cover-eyebrow">Admin Portal · Official Report</div>
  <div class="cover-title">${title}</div>
  <div class="cover-subtitle">${subtitle}</div>
  <div class="cover-divider"></div>
  <table class="cover-meta-table">
    <tr>
      <td class="cover-meta-label">Report Date</td>
      <td class="cover-meta-label">Prepared By</td>
    </tr>
    <tr>
      <td class="cover-meta-value">${generatedAt}</td>
      <td class="cover-meta-value">${preparedBy}</td>
    </tr>
    <tr>
      <td class="cover-meta-label">System</td>
      <td class="cover-meta-label">Report ID</td>
    </tr>
    <tr>
      <td class="cover-meta-value">SnapShroom v1.0.0</td>
      <td class="cover-meta-value">SSR-${Date.now().toString(36).toUpperCase()}</td>
    </tr>
  </table>
  <div class="cover-classification">Confidential — Internal Use Only</div>
</div>`;

const tocPage = (reportTitle: string, items: { num: string; label: string }[]) => {
  const rows = items.map(it => `
    <tr>
      <td class="toc-num">${it.num}</td>
      <td class="toc-label">${it.label}</td>
    </tr>`).join('');

  return pageShell(reportTitle, 'Table of Contents', 1, `
    <div class="toc-title">Table of Contents</div>
    <table class="toc-table">${rows}</table>
  `);
};

const sectionHeading = (num: string, title: string) => `
  <div class="section-heading">
    <span class="section-num">${num}</span>
    <span class="section-title">${title}</span>
  </div>
  <div class="section-rule"></div>`;

const kpiGrid = (cards: { value: string | number; label: string; delta?: string; cls?: string }[]) => `
  <div class="kpi-grid">
    ${cards.map(c => `
      <div class="kpi-card${c.cls ? ' ' + c.cls : ''}">
        <span class="kpi-value">${c.value}</span>
        <span class="kpi-label">${c.label}</span>
        ${c.delta ? `<span class="kpi-delta">${c.delta}</span>` : ''}
      </div>
    `).join('')}
  </div>`;

const distBar = (label: string, value: number, total: number, color: string) => `
  <div class="dist-item">
    <span class="dist-label">${label}</span>
    <div class="dist-track">
      <div class="dist-fill" style="width:${barW(value, total)}%;background-color:${color};"></div>
    </div>
    <span class="dist-value">${value.toLocaleString()} (${pct(value, total)})</span>
  </div>`;

const rankedList = (items: { name: string; count: number }[], total: number, color: string, limit = 8) => {
  const max = items[0]?.count ?? 1;
  return items.slice(0, limit).map((item, i) => `
    <div class="rank-item">
      <span class="rank-medal">${medal(i)}</span>
      <span class="rank-name">${item.name}</span>
      <div class="rank-bar">
        <div class="rank-bar-fill" style="width:${barW(item.count, max)}%;background-color:${color};"></div>
      </div>
      <span class="rank-count">${item.count.toLocaleString()}</span>
      <span class="rank-pct">${pct(item.count, total)}</span>
    </div>
  `).join('');
};

const sparkline = (data: { date: string; scans: number }[], limit = 28) => {
  const slice = data.slice(-limit);
  const max = Math.max(...slice.map(d => d.scans), 1);
  
  return `
    <div class="sparkline-container">
      ${slice.map(d => {
        const height = Math.max(4, (d.scans / max) * 100);
        return `<div class="spark-bar" style="height:${height}%;"></div>`;
      }).join('')}
    </div>
  `;
};

/* ════════════════════════════════════════════════════════════════
   INTERFACES
════════════════════════════════════════════════════════════════ */

interface MushroomAnalytics {
  total_scans: number;
  scans_last_30d: number;
  most_scanned_mushrooms: { name: string; count: number }[];
  top_locations: { location: string; count: number }[];
  detection_success_rate: number;
  edible_vs_toxic: { edible: number; toxic: number; unknown: number };
}

interface UserAnalytics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_count: number;
  recent_registrations_30d: number;
  recent_logins_7d: number;
}

interface Analytics {
  users: UserAnalytics;
  mushrooms: MushroomAnalytics;
  timeline: { date: string; scans: number }[];
}

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
  is_active: boolean;
  last_login?: string;
}

/* ─── Executive summaries ─── */
const execSummaryAnalytics = (a: Analytics) => {
  const activeRate = a.users.total_users > 0
    ? ((a.users.active_users / a.users.total_users) * 100).toFixed(1) : '0';
  const topMush = a.mushrooms.most_scanned_mushrooms[0]?.name ?? 'N/A';
  const topLoc = a.mushrooms.top_locations[0]?.location ?? 'N/A';
  const edibleShare = a.mushrooms.total_scans > 0
    ? ((a.mushrooms.edible_vs_toxic.edible / a.mushrooms.total_scans) * 100).toFixed(1) : '0';

  return `This report presents a comprehensive analysis of platform activity for the SnapShroom
mushroom identification system. As of the reporting date, the platform has <strong>${a.users.total_users}
registered users</strong>, of whom <strong>${a.users.active_users} (${activeRate}%) are currently active</strong>.
The platform has processed <strong>${a.mushrooms.total_scans} total identification scans</strong>, with
<strong>${a.mushrooms.scans_last_30d} scans recorded in the past 30 days</strong>.
The automated detection pipeline achieved a success rate of <strong>${a.mushrooms.detection_success_rate}%</strong>.
The most frequently identified species is <em>${topMush}</em>, and the highest-volume scanning
location is <em>${topLoc}</em>. Of all scans with edibility classifications,
<strong>${edibleShare}% were identified as edible species</strong>.`;
};

const execSummaryUsers = (users: User[]) => {
  const active = users.filter(u => u.is_active).length;
  const inactive = users.filter(u => !u.is_active).length;
  const admins = users.filter(u => u.role === 'admin').length;
  const activeRate = users.length > 0 ? ((active / users.length) * 100).toFixed(1) : '0';
  const newest = [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return `This report provides a complete directory of all <strong>${users.length}
registered SnapShroom accounts</strong>. Of these, <strong>${active} accounts are active
(${activeRate}%)</strong> and <strong>${inactive} are currently deactivated</strong>.
The platform has <strong>${admins} administrator account${admins !== 1 ? 's' : ''}</strong>.
${newest ? `The most recently registered account belongs to <em>${newest.name}</em>,
created on ${fmtDate(newest.created_at)}.` : ''}`;
};

/* ════════════════════════════════════════════════════════════════
   BUILD ANALYTICS REPORT
════════════════════════════════════════════════════════════════ */

export const buildAnalyticsReport = (analytics: Analytics, adminName: string): string => {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const title = 'Platform Analytics Report';
  const userActPct = analytics.users.total_users > 0
    ? ((analytics.users.active_users / analytics.users.total_users) * 100).toFixed(1) : '0';

  // Page 2: Executive Summary + User KPIs
  const page2 = pageShell(title, 'Executive Summary & User Overview', 2, `
    ${sectionHeading('01', 'Executive Summary')}
    <div class="exec-box">
      <div class="exec-label">Key Findings</div>
      <div class="exec-text">${execSummaryAnalytics(analytics)}</div>
    </div>

    ${sectionHeading('02', 'User Analytics')}

    ${kpiGrid([
      { value: analytics.users.total_users, label: 'Total Users', cls: 'teal' },
      { value: analytics.users.active_users, label: 'Active', cls: 'teal', delta: `${userActPct}%` },
      { value: analytics.users.inactive_users, label: 'Inactive', cls: 'red' },
      { value: analytics.users.admin_count, label: 'Admins' },
      { value: analytics.users.recent_registrations_30d, label: 'New (30d)' },
      { value: analytics.users.recent_logins_7d, label: 'Logins (7d)' },
    ])}

    <div class="subsection-title">Account Status Distribution</div>
    ${distBar('Active Accounts', analytics.users.active_users, analytics.users.total_users, C.teal)}
    ${distBar('Inactive Accounts', analytics.users.inactive_users, analytics.users.total_users, C.red)}
    ${distBar('Admin Accounts', analytics.users.admin_count, analytics.users.total_users, C.sage)}
  `);

  // Page 3: Mushroom Scan Analytics
  const edibleTotal = analytics.mushrooms.edible_vs_toxic.edible +
    analytics.mushrooms.edible_vs_toxic.toxic +
    analytics.mushrooms.edible_vs_toxic.unknown;

  const page3 = pageShell(title, 'Mushroom Scan Analytics', 3, `
    ${sectionHeading('03', 'Mushroom Scan Analytics')}

    ${kpiGrid([
      { value: analytics.mushrooms.total_scans, label: 'Total Scans' },
      { value: analytics.mushrooms.scans_last_30d, label: 'Last 30 Days', cls: 'teal' },
      { value: `${analytics.mushrooms.detection_success_rate}%`,
        label: 'Detection Success',
        cls: analytics.mushrooms.detection_success_rate >= 80 ? 'teal' : 'amber' },
    ])}

    <div class="two-col">
      <div class="col">
        <div class="subsection-title">Edibility Classification</div>
        ${distBar('Edible', analytics.mushrooms.edible_vs_toxic.edible, edibleTotal, '#27AE60')}
        ${distBar('Toxic', analytics.mushrooms.edible_vs_toxic.toxic, edibleTotal, C.red)}
        ${distBar('Unknown', analytics.mushrooms.edible_vs_toxic.unknown, edibleTotal, C.light)}
      </div>
      <div class="col">
        <div class="subsection-title">At a Glance</div>
        <table class="data-table">
          <tr><td>Edible identified</td><td class="right">${analytics.mushrooms.edible_vs_toxic.edible}</td></tr>
          <tr><td>Toxic identified</td><td class="right">${analytics.mushrooms.edible_vs_toxic.toxic}</td></tr>
          <tr><td>Unclassified</td><td class="right">${analytics.mushrooms.edible_vs_toxic.unknown}</td></tr>
          <tr class="total"><td>Total classified</td><td class="right">${edibleTotal}</td></tr>
        </table>
      </div>
    </div>

    <div class="subsection-title">Top Identified Species</div>
    ${analytics.mushrooms.most_scanned_mushrooms.length > 0
      ? rankedList(analytics.mushrooms.most_scanned_mushrooms, analytics.mushrooms.total_scans, C.sage)
      : '<p style="color:#999;padding:3mm 0;">No species data available.</p>'}
  `);

  // Page 4: Locations + Timeline
  const timelineData = analytics.timeline ?? [];
  const totalTimelineScans = timelineData.reduce((s, t) => s + t.scans, 0);
  const avgDaily = timelineData.length > 0 ? (totalTimelineScans / timelineData.length).toFixed(1) : '0';
  const peakDay = timelineData.reduce((best, t) => t.scans > best.scans ? t : best, { date: 'N/A', scans: 0 });

  const page4 = pageShell(title, 'Locations & Scan Timeline', 4, `
    ${sectionHeading('04', 'Top Scan Locations')}

    ${analytics.mushrooms.top_locations.length > 0
      ? rankedList(
          analytics.mushrooms.top_locations.map(l => ({ name: l.location, count: l.count })),
          analytics.mushrooms.total_scans, C.teal
        )
      : '<p style="color:#999;padding:3mm 0;">No location data available.</p>'}

    ${timelineData.length > 0 ? `
      ${sectionHeading('05', 'Scan Activity Timeline')}

      ${kpiGrid([
        { value: totalTimelineScans.toLocaleString(), label: 'Total (Period)', cls: 'teal' },
        { value: avgDaily, label: 'Avg / Day' },
        { value: peakDay.scans, label: 'Peak Day', delta: peakDay.date },
        { value: timelineData.length, label: 'Days Tracked' },
      ])}

      <div class="subsection-title">Daily Activity (last ${Math.min(timelineData.length, 28)} days)</div>
      ${sparkline(timelineData)}
    ` : ''}
  `);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SnapShroom Analytics Report</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  ${coverPage(title, 'Comprehensive platform usage metrics, user statistics, and scan activity analysis.', now, adminName)}
  ${tocPage(title, [
    { num: '01', label: 'Executive Summary' },
    { num: '02', label: 'User Analytics' },
    { num: '03', label: 'Mushroom Scan Analytics' },
    { num: '04', label: 'Top Scan Locations' },
    { num: '05', label: 'Scan Activity Timeline' },
  ])}
  ${page2}
  ${page3}
  ${page4}
</body>
</html>`;
};

/* ════════════════════════════════════════════════════════════════
   BUILD USERS REPORT
════════════════════════════════════════════════════════════════ */

export const buildUsersReport = (users: User[], adminName: string): string => {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const title = 'User Directory Report';

  const active = users.filter(u => u.is_active).length;
  const inactive = users.filter(u => !u.is_active).length;
  const admins = users.filter(u => u.role === 'admin').length;

  const page2 = pageShell(title, 'User Summary', 2, `
    ${sectionHeading('01', 'Executive Summary')}
    <div class="exec-box">
      <div class="exec-label">Key Findings</div>
      <div class="exec-text">${execSummaryUsers(users)}</div>
    </div>

    ${sectionHeading('02', 'Account Overview')}

    ${kpiGrid([
      { value: users.length, label: 'Total Accounts', cls: 'teal' },
      { value: active, label: 'Active', cls: 'teal', delta: pct(active, users.length) },
      { value: inactive, label: 'Inactive', cls: 'red', delta: pct(inactive, users.length) },
      { value: admins, label: 'Admins', delta: pct(admins, users.length) },
    ])}

    <div class="subsection-title">Status Distribution</div>
    ${distBar('Active', active, users.length, C.teal)}
    ${distBar('Inactive', inactive, users.length, C.red)}
    ${distBar('Admins', admins, users.length, C.sage)}
  `);

  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
  const chunkSize = 18;
  const chunks: User[][] = [];
  for (let i = 0; i < sorted.length; i += chunkSize) {
    chunks.push(sorted.slice(i, i + chunkSize));
  }

  const dirPages = chunks.map((chunk, ci) => {
    const pageNum = ci + 3;
    const rangeLabel = `${ci * chunkSize + 1}–${Math.min((ci + 1) * chunkSize, sorted.length)} of ${sorted.length}`;

    return pageShell(title, `User Directory (${rangeLabel})`, pageNum, `
      ${ci === 0 ? sectionHeading('03', 'Complete User Directory') : ''}
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Last Login</th>
          </tr>
        </thead>
        <tbody>
          ${chunk.map((u, i) => `
          <tr>
            <td>${ci * chunkSize + i + 1}</td>
            <td><strong>${u.name}</strong></td>
            <td class="mono">@${u.username}</td>
            <td class="mono">${u.email}</td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td><span class="badge badge-${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>${fmtDate(u.created_at)}</td>
            <td>${u.last_login ? fmtDate(u.last_login) : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    `);
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SnapShroom User Directory Report</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  ${coverPage(title, 'Complete account directory with role assignments and status classifications.', now, adminName)}
  ${tocPage(title, [
    { num: '01', label: 'Executive Summary' },
    { num: '02', label: 'Account Overview' },
    { num: '03', label: 'User Directory' },
  ])}
  ${page2}
  ${dirPages}
</body>
</html>`;
};

/* ════════════════════════════════════════════════════════════════
   BUILD OVERVIEW REPORT
════════════════════════════════════════════════════════════════ */

export const buildOverviewReport = (analytics: Analytics, adminName: string): string => {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const title = 'Dashboard Overview Report';

  const userActPct = analytics.users.total_users > 0
    ? ((analytics.users.active_users / analytics.users.total_users) * 100).toFixed(1) : '0';

  const timelineData = analytics.timeline ?? [];
  const totalTLScans = timelineData.reduce((s, t) => s + t.scans, 0);
  const avgDaily = timelineData.length > 0 ? (totalTLScans / timelineData.length).toFixed(1) : '0';

  const page2 = pageShell(title, 'Platform Overview', 2, `
    ${sectionHeading('01', 'Executive Summary')}
    <div class="exec-box">
      <div class="exec-label">Platform Status</div>
      <div class="exec-text">${execSummaryAnalytics(analytics)}</div>
    </div>

    ${sectionHeading('02', 'Key Performance Indicators')}

    ${kpiGrid([
      { value: analytics.users.total_users, label: 'Total Users', cls: 'teal' },
      { value: analytics.users.active_users, label: 'Active Users', cls: 'teal', delta: `${userActPct}%` },
      { value: analytics.mushrooms.total_scans, label: 'Total Scans' },
      { value: analytics.mushrooms.scans_last_30d, label: 'Scans (30d)' },
      { value: `${analytics.mushrooms.detection_success_rate}%`, label: 'Success Rate',
        cls: analytics.mushrooms.detection_success_rate >= 80 ? 'teal' : 'amber' },
      { value: analytics.users.admin_count, label: 'Admins' },
    ])}

    <div class="two-col">
      <div class="col">
        <div class="subsection-title">User Status</div>
        ${distBar('Active', analytics.users.active_users, analytics.users.total_users, C.teal)}
        ${distBar('Inactive', analytics.users.inactive_users, analytics.users.total_users, C.red)}
        ${distBar('Admins', analytics.users.admin_count, analytics.users.total_users, C.sage)}
      </div>
      <div class="col">
        <div class="subsection-title">Scan Edibility</div>
        ${distBar('Edible', analytics.mushrooms.edible_vs_toxic.edible, analytics.mushrooms.total_scans, '#27AE60')}
        ${distBar('Toxic', analytics.mushrooms.edible_vs_toxic.toxic, analytics.mushrooms.total_scans, C.red)}
        ${distBar('Unknown', analytics.mushrooms.edible_vs_toxic.unknown, analytics.mushrooms.total_scans, C.light)}
      </div>
    </div>

    ${timelineData.length > 0 ? `
      <div class="subsection-title">Scan Activity Trend</div>
      ${sparkline(timelineData)}
    ` : ''}

    ${analytics.mushrooms.most_scanned_mushrooms.length > 0 ? `
      <div class="subsection-title">Top 5 Species</div>
      ${rankedList(analytics.mushrooms.most_scanned_mushrooms, analytics.mushrooms.total_scans, C.sage, 5)}
    ` : ''}
  `);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SnapShroom Dashboard Overview Report</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  ${coverPage(title, 'High-level platform health snapshot including user status and scan performance.', now, adminName)}
  ${tocPage(title, [
    { num: '01', label: 'Executive Summary' },
    { num: '02', label: 'Key Performance Indicators' },
    { num: '03', label: 'User Status & Scan Distribution' },
    { num: '04', label: 'Activity Trend & Top Species' },
  ])}
  ${page2}
</body>
</html>`;
};