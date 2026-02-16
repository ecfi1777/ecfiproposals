import { LineItem, calcSection, calcTotalYards, calcVolumeSplit, fmtCurrency, isRebarEligible, calcRebarForLine, calcTotalRebarLF, parseWallHeight } from "@/lib/ecfi-utils";
import { calcCYPerUnit } from "@/lib/calcCYPerUnit";

interface CostReportData {
  builder: string;
  date: string;
  location: string;
  concretePerYard: number;
  laborPerYard: number;
  otherCostVal: number;
  otherCostsNote: string;
  otherCostsMode: "$" | "%";
  otherCostsRaw: number;
  totalYards: number;
  orderYards: number;
  concreteCost: number;
  laborCost: number;
  rebarTotalCost: number;
  totalRebarLF: number;
  adjustedSticks: number;
  rawSticks: number;
  costPerStick: number;
  wastePercent: number;
  totalCost: number;
  foundationRevenue: number;
  grossProfit: number;
  grossMargin: number;
  proposalTotal: number;
}

function buildReportHTML(
  data: CostReportData,
  ftgLines: LineItem[],
  slabLines: LineItem[],
): string {
  const allLines = [...ftgLines, ...slabLines];
  const fc = fmtCurrency;

  // Volume rows
  const ftgVolLines = ftgLines.filter(l => l.description && (l.qty || l.cyOverride));
  const slabVolLines = slabLines.filter(l => l.description && (l.qty || l.cyOverride));
  const ftgYards = calcTotalYards(ftgLines);
  const slabYards = calcTotalYards(slabLines);

  let volumeRows = "";
  const makeVolRow = (l: LineItem) => {
    const qty = parseFloat(l.qty) || 0;
    const vc = calcCYPerUnit(l.description);
    const hasOverride = l.cyOverride !== "";
    const wallCY = hasOverride ? 0 : qty * vc.wallCY;
    const ftgCY = hasOverride ? 0 : qty * vc.ftgCY;
    const slabCY = hasOverride ? 0 : Math.max(0, (qty * vc.cy) - wallCY - ftgCY);
    const totalCY = hasOverride ? (parseFloat(l.cyOverride) || 0) : qty * vc.cy;
    if (totalCY === 0 && !hasOverride) return "";
    return `<tr>
      <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:left">${l.description}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${qty || ""}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:center">${l.unit}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${wallCY > 0 ? wallCY.toFixed(2) : "-"}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${ftgCY > 0 ? ftgCY.toFixed(2) : "-"}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${slabCY > 0 ? slabCY.toFixed(2) : "-"}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${totalCY.toFixed(2)}${hasOverride ? " *" : ""}</td>
    </tr>`;
  };

  if (ftgVolLines.length > 0) {
    volumeRows += `<tr><td colspan="7" style="padding:6px 8px;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;background:#f8fafc">Footings & Walls</td></tr>`;
    ftgVolLines.forEach(l => { volumeRows += makeVolRow(l); });
    volumeRows += `<tr style="background:#f8fafc"><td colspan="6" style="padding:4px 8px;text-align:right;font-weight:600;font-size:11px">Subtotal</td><td style="padding:4px 8px;text-align:right;font-weight:700">${ftgYards.toFixed(2)} CY</td></tr>`;
  }
  if (slabVolLines.length > 0) {
    volumeRows += `<tr><td colspan="7" style="padding:6px 8px;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;background:#f8fafc">Slabs</td></tr>`;
    slabVolLines.forEach(l => { volumeRows += makeVolRow(l); });
    volumeRows += `<tr style="background:#f8fafc"><td colspan="6" style="padding:4px 8px;text-align:right;font-weight:600;font-size:11px">Subtotal</td><td style="padding:4px 8px;text-align:right;font-weight:700">${slabYards.toFixed(2)} CY</td></tr>`;
  }

  // Rebar section
  const rebarLines = ftgLines.filter(
    l => l.rebar && isRebarEligible(l.description) && (l.rebar.horizFtgBars > 0 || l.rebar.horizWallBars > 0 || l.rebar.vertSpacingInches > 0)
  );
  const lineItemRebarLines = allLines.filter(
    l => l.description && /^rebar/i.test(l.description.trim()) && l.qty
  );
  const calculatorRebarLF = calcTotalRebarLF(ftgLines);
  const lineItemRebarLF = lineItemRebarLines.reduce((sum, l) => sum + (parseFloat(l.qty) || 0), 0);
  const hasRebar = rebarLines.length > 0 || lineItemRebarLines.length > 0;

  let rebarSection = "";
  if (hasRebar) {
    let rebarRows = "";

    if (rebarLines.length > 0) {
      rebarRows += `<tr><td colspan="9" style="padding:6px 8px;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;background:#f8fafc">Calculator Rebar (from wall icons)</td></tr>`;
      rebarLines.forEach(l => {
        const r = calcRebarForLine(l);
        const qty = parseFloat(l.qty) || 0;
        const wallHt = parseWallHeight(l.description);
        const vertSpacing = l.rebar!.vertSpacingInches;
        rebarRows += `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb">${l.description}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${l.qty}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${l.rebar!.horizFtgBars}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${l.rebar!.horizWallBars}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${vertSpacing || "-"}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${r.horizFtgLF.toFixed(0)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${r.horizWallLF.toFixed(0)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${r.vertLF.toFixed(0)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${r.totalLF.toFixed(0)}</td>
        </tr>`;
        // Detail breakdown
        rebarRows += `<tr><td colspan="9" style="padding:2px 8px 6px 32px;font-size:10px;color:#94a3b8;border-bottom:1px solid #f1f5f9">`;
        rebarRows += `Horiz Ftg: ${l.rebar!.horizFtgBars} × ${qty.toFixed(0)} = ${r.horizFtgLF.toFixed(0)} LF &nbsp;|&nbsp; `;
        rebarRows += `Horiz Wall: ${l.rebar!.horizWallBars} × ${qty.toFixed(0)} = ${r.horizWallLF.toFixed(0)} LF`;
        if (vertSpacing > 0 && wallHt > 0) {
          const numVert = Math.ceil(qty / (vertSpacing / 12));
          const barLen = wallHt - 0.25;
          rebarRows += ` &nbsp;|&nbsp; Vert: ${numVert} bars × ${barLen.toFixed(2)}' = ${r.vertLF.toFixed(0)} LF`;
        }
        rebarRows += `</td></tr>`;
      });
      rebarRows += `<tr style="background:#f8fafc"><td colspan="8" style="padding:4px 8px;text-align:right;font-weight:600;font-size:11px">Calculator Rebar</td><td style="padding:4px 8px;text-align:right;font-weight:700">${calculatorRebarLF.toLocaleString()} LF</td></tr>`;
    }

    if (lineItemRebarLines.length > 0) {
      rebarRows += `<tr><td colspan="9" style="padding:6px 8px;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;background:#f8fafc">Line Item Rebar (from proposal)</td></tr>`;
      lineItemRebarLines.forEach(l => {
        rebarRows += `<tr>
          <td colspan="8" style="padding:4px 8px;border-bottom:1px solid #e5e7eb">${l.description}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${(parseFloat(l.qty) || 0).toLocaleString()}</td>
        </tr>`;
      });
      rebarRows += `<tr style="background:#f8fafc"><td colspan="8" style="padding:4px 8px;text-align:right;font-weight:600;font-size:11px">Line Item Rebar</td><td style="padding:4px 8px;text-align:right;font-weight:700">${lineItemRebarLF.toLocaleString()} LF</td></tr>`;
    }

    const stickLine = data.wastePercent > 0
      ? `${data.totalRebarLF.toLocaleString()} LF → ${data.rawSticks.toLocaleString()} sticks + ${data.wastePercent}% waste = ${data.adjustedSticks.toLocaleString()} sticks × ${fc(data.costPerStick)} = ${fc(data.rebarTotalCost)}`
      : `${data.totalRebarLF.toLocaleString()} LF → ${data.adjustedSticks.toLocaleString()} sticks × ${fc(data.costPerStick)} = ${fc(data.rebarTotalCost)}`;

    rebarSection = `
      <div style="margin-top:28px">
        <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Rebar</h2>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr style="border-bottom:2px solid #1e293b">
            <th style="padding:4px 8px;text-align:left">Description</th>
            <th style="padding:4px 8px;text-align:right;width:50px">Qty</th>
            <th style="padding:4px 8px;text-align:right;width:40px">H.Ftg</th>
            <th style="padding:4px 8px;text-align:right;width:45px">H.Wall</th>
            <th style="padding:4px 8px;text-align:right;width:45px">V.Spc"</th>
            <th style="padding:4px 8px;text-align:right;width:55px">Ftg LF</th>
            <th style="padding:4px 8px;text-align:right;width:55px">Wall LF</th>
            <th style="padding:4px 8px;text-align:right;width:50px">Vert LF</th>
            <th style="padding:4px 8px;text-align:right;width:60px">Total LF</th>
          </tr></thead>
          <tbody>${rebarRows}</tbody>
        </table>
        <div style="margin-top:8px;padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:4px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">TOTAL REBAR: ${data.totalRebarLF.toLocaleString()} LF</div>
          <div style="font-size:11px;color:#64748b">${stickLine}</div>
        </div>
      </div>`;
  }

  // Margin color (inline for print)
  const marginColor = data.grossMargin >= 30 ? "#15803d" : data.grossMargin >= 15 ? "#1e5eff" : "#b91c1c";
  const profitColor = data.grossProfit >= 0 ? "#15803d" : "#b91c1c";

  // Other costs label
  let otherCostsLabel = `Other Costs${data.otherCostsNote ? ` — ${data.otherCostsNote}` : ""}`;
  if (data.otherCostsMode === "%" && data.otherCostsRaw > 0) {
    otherCostsLabel += ` (${data.otherCostsRaw}%)`;
  }

  // Rebar cost line
  let rebarCostLabel: string;
  if (hasRebar) {
    rebarCostLabel = data.wastePercent > 0
      ? `Rebar (${data.adjustedSticks.toLocaleString()} sticks w/ ${data.wastePercent}% waste × ${fc(data.costPerStick)}/stick)`
      : `Rebar (${data.adjustedSticks.toLocaleString()} sticks × ${fc(data.costPerStick)}/stick)`;
  } else {
    rebarCostLabel = "Rebar";
  }

  return `<!DOCTYPE html><html><head><title>Cost Analysis Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'JetBrains Mono','Courier New',monospace; font-size:12px; color:#1e293b; background:#fff; padding:0.5in 0.6in; }
  @media print {
    body { padding:0; margin:0.4in 0.5in; }
    @page { size:letter; margin:0.4in 0.5in; }
    .no-print { display:none !important; }
  }
  table { page-break-inside:avoid; }
  h2 { page-break-after:avoid; }
</style></head><body>

<div style="text-align:center;margin-bottom:6px">
  <h1 style="font-size:20px;font-weight:800;letter-spacing:3px;text-transform:uppercase">Cost Analysis Report</h1>
</div>
<div style="border-top:2px solid #1e293b;margin-bottom:16px"></div>
<table style="width:100%;font-size:11px;margin-bottom:24px">
  <tr>
    <td style="width:33%"><strong>Builder:</strong> ${data.builder || "—"}</td>
    <td style="width:33%;text-align:center"><strong>Location:</strong> ${data.location || "—"}</td>
    <td style="width:33%;text-align:right"><strong>Date:</strong> ${data.date || "—"}</td>
  </tr>
</table>

<!-- CONCRETE VOLUME -->
<h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Concrete Volume</h2>
<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:4px">
  <thead><tr style="border-bottom:2px solid #1e293b">
    <th style="padding:4px 8px;text-align:left">Description</th>
    <th style="padding:4px 8px;text-align:right;width:45px">Qty</th>
    <th style="padding:4px 8px;text-align:center;width:35px">Unit</th>
    <th style="padding:4px 8px;text-align:right;width:60px">Wall CY</th>
    <th style="padding:4px 8px;text-align:right;width:55px">Ftg CY</th>
    <th style="padding:4px 8px;text-align:right;width:55px">Slab CY</th>
    <th style="padding:4px 8px;text-align:right;width:65px">Total CY</th>
  </tr></thead>
  <tbody>${volumeRows}</tbody>
</table>
<div style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:4px;font-weight:700;font-size:13px;text-align:right">
  Total Concrete: ${data.totalYards.toFixed(2)} CY &nbsp;→&nbsp; Order: ${data.orderYards.toFixed(1)} CY
</div>

${rebarSection}

<!-- COST SUMMARY -->
<div style="margin-top:28px">
  <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Cost Summary</h2>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:6px 8px">Concrete (${data.orderYards.toFixed(1)} yd × ${fc(data.concretePerYard)}/yd)</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600">${fc(data.concreteCost)}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:6px 8px">Labor (${data.orderYards.toFixed(1)} yd × ${fc(data.laborPerYard)}/yd)</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600">${fc(data.laborCost)}</td>
    </tr>
    ${hasRebar ? `<tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:6px 8px">${rebarCostLabel}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600">${fc(data.rebarTotalCost)}</td>
    </tr>` : ""}
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:6px 8px">${otherCostsLabel}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600">${fc(data.otherCostVal)}</td>
    </tr>
    <tr style="border-top:3px solid #1e293b">
      <td style="padding:8px;font-weight:800;font-size:13px">TOTAL COST</td>
      <td style="padding:8px;text-align:right;font-weight:800;font-size:14px">${fc(data.totalCost)}</td>
    </tr>
  </table>
</div>

<!-- MARGIN ANALYSIS -->
<div style="margin-top:28px">
  <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Margin Analysis</h2>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:6px 8px">Revenue (Proposal Total)</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600">${fc(data.proposalTotal)}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:6px 8px">Foundation Revenue</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600">${fc(data.foundationRevenue)}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:6px 8px">Total Cost</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600">${fc(data.totalCost)}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:6px 8px;font-weight:700">Gross Profit</td>
      <td style="padding:6px 8px;text-align:right;font-weight:800;font-size:14px;color:${profitColor}">${fc(data.grossProfit)}</td>
    </tr>
    <tr style="border-top:3px solid #1e293b">
      <td style="padding:8px;font-weight:800;font-size:13px">Gross Margin</td>
      <td style="padding:8px;text-align:right;font-weight:800;font-size:16px;color:${marginColor}">${data.grossMargin.toFixed(1)}%</td>
    </tr>
  </table>
</div>

</body></html>`;
}

export function openCostAnalysisReport(
  proposal: {
    builder: string;
    date: string;
    location: string;
    concretePerYard: string;
    laborPerYard: string;
    otherCosts: string;
    otherCostsMode: "$" | "%";
    otherCostsNote: string;
    concreteYardsOverride: string;
    rebarCostPerStick: string;
    rebarWastePercent: string;
  },
  ftgLines: LineItem[],
  slabLines: LineItem[],
) {
  const allLines = [...ftgLines, ...slabLines];
  const ftgTotals = calcSection(ftgLines);
  const slabTotals = calcSection(slabLines);
  const grandStd = ftgTotals.std + slabTotals.std;
  const grandOpt = ftgTotals.opt + slabTotals.opt;
  const proposalTotal = grandStd + grandOpt;

  const foundationLines = allLines.filter(l => !/concrete\s*pump/i.test(l.description) && !/winter\s*concrete/i.test(l.description));
  const foundationTotals = calcSection(foundationLines);
  const foundationRevenue = foundationTotals.std + foundationTotals.opt;

  const ftgYards = calcTotalYards(ftgLines);
  const slabYards = calcTotalYards(slabLines);
  const autoTotalYards = ftgYards + slabYards;
  const totalYards = proposal.concreteYardsOverride
    ? parseFloat(proposal.concreteYardsOverride) || 0
    : autoTotalYards;
  const orderYards = Math.ceil(totalYards * 2) / 2;

  const concretePerYard = parseFloat(proposal.concretePerYard) || 0;
  const laborPerYard = parseFloat(proposal.laborPerYard) || 0;
  const concreteCost = concretePerYard * orderYards;
  const laborCost = laborPerYard * orderYards;

  const calculatorRebarLF = calcTotalRebarLF(ftgLines);
  const lineItemRebarLF = allLines
    .filter(l => l.description && /^rebar/i.test(l.description.trim()) && l.qty)
    .reduce((sum, l) => sum + (parseFloat(l.qty) || 0), 0);
  const totalRebarLF = calculatorRebarLF + lineItemRebarLF;

  const costPerStick = parseFloat(proposal.rebarCostPerStick) || 0;
  const wastePercent = parseFloat(proposal.rebarWastePercent) || 0;
  const rawSticks = Math.ceil(totalRebarLF / 20);
  const adjustedSticks = Math.ceil(rawSticks * (1 + wastePercent / 100));
  const rebarTotalCost = adjustedSticks * costPerStick;

  const otherCostsRaw = parseFloat(proposal.otherCosts) || 0;
  const baseCost = concreteCost + laborCost + rebarTotalCost;
  const otherCostVal = proposal.otherCostsMode === "%" ? (baseCost * otherCostsRaw / 100) : otherCostsRaw;
  const totalCost = concreteCost + laborCost + otherCostVal + rebarTotalCost;
  const grossProfit = foundationRevenue - totalCost;
  const grossMargin = foundationRevenue > 0 ? (grossProfit / foundationRevenue) * 100 : 0;

  const html = buildReportHTML({
    builder: proposal.builder,
    date: proposal.date,
    location: proposal.location,
    concretePerYard, laborPerYard, otherCostVal, otherCostsNote: proposal.otherCostsNote,
    otherCostsMode: proposal.otherCostsMode, otherCostsRaw,
    totalYards, orderYards, concreteCost, laborCost,
    rebarTotalCost, totalRebarLF, adjustedSticks, rawSticks, costPerStick, wastePercent,
    totalCost, foundationRevenue, grossProfit, grossMargin, proposalTotal,
  }, ftgLines, slabLines);

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}
