import { useRef, useState } from "react";
import { LineItem, calcSection, fmt, fmtCurrency } from "@/lib/ecfi-utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Printer } from "lucide-react";

interface PreviewTabProps {
  proposal: {
    builder: string;
    date: string;
    location: string;
    county: string;
    foundType: string;
    foundSize: string;
  };
  ftgLines: LineItem[];
  slabLines: LineItem[];
}

const extraCharges = [
  { desc: "*** Concrete Pump - Cost + 5% or Flat Rate - Required for almost every pour", rate: "AVG $850/EA", tbd: "tbd" },
  { desc: "*** Extra Concrete In Footing Due to Ground Condition or Excavation", rate: "$350/YARD", tbd: "tbd" },
  { desc: "*** Extra Labor", rate: "$185/HOUR", tbd: "tbd" },
  { desc: '*** Winter Concrete - Hot Water (Mid November - Mid April) **STANDARD**', rate: "$4.25/YARD", tbd: "tbd" },
  { desc: '*** 1% High Early (Mid November - Mid April) **UNDER 45 DEGREES**', rate: "$5.75/YARD", tbd: "tbd" },
];

export function PreviewTab({ proposal, ftgLines, slabLines }: PreviewTabProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const allFtg = ftgLines.filter((l) => l.description);
  const allSlab = slabLines.filter((l) => l.description);
  const ftgTotals = calcSection(ftgLines);
  const slabTotals = calcSection(slabLines);
  const grandStd = ftgTotals.std + slabTotals.std;
  const grandOpt = ftgTotals.opt + slabTotals.opt;
  const grandTotal = grandStd + grandOpt;

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let yOffset = 0;
      const printableHeight = pageHeight - margin * 2;

      while (yOffset < imgHeight) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, margin - yOffset, contentWidth, imgHeight);
        yOffset += printableHeight;
      }

      const fileName = proposal.builder
        ? `ECFI-Proposal-${proposal.builder.replace(/\s+/g, "-")}.pdf`
        : "ECFI-Proposal.pdf";
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>ECFI Proposal</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'JetBrains Mono', 'Courier New', monospace; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const renderLineRow = (l: LineItem, i: number) => {
    const ts = l.qty && l.unitPriceStd ? parseFloat(l.qty) * parseFloat(l.unitPriceStd) : 0;
    const to = l.qty && l.unitPriceOpt ? parseFloat(l.qty) * parseFloat(l.unitPriceOpt) : 0;
    return (
      <tr key={i}>
        <td className="px-2 py-[3px] border border-black text-right text-[11px]">{l.qty}</td>
        <td className="px-2 py-[3px] border border-black text-center text-[11px]">{l.unit}</td>
        <td className="px-2 py-[3px] border border-black text-[11px]">{l.description}</td>
        <td className="px-2 py-[3px] border border-black text-right text-[11px]">{l.unitPriceStd ? fmt(parseFloat(l.unitPriceStd)) : ""}</td>
        <td className="px-2 py-[3px] border border-black text-right text-[11px]">{ts ? fmt(ts) : ""}</td>
        <td className="px-2 py-[3px] border border-black text-right text-[11px]">{l.unitPriceOpt ? fmt(parseFloat(l.unitPriceOpt)) : ""}</td>
        <td className="px-2 py-[3px] border border-black text-right text-[11px]">{to ? fmt(to) : ""}</td>
      </tr>
    );
  };

  const renderSubtotalRow = (label: string, totals: { std: number; opt: number }) => (
    <tr className="font-bold bg-gray-100">
      <td colSpan={4} className="px-2 py-[3px] border border-black text-right text-[11px] uppercase">{label}</td>
      <td className="px-2 py-[3px] border border-black text-right text-[11px]">{fmt(totals.std)}</td>
      <td className="px-2 py-[3px] border border-black text-right text-[11px]"></td>
      <td className="px-2 py-[3px] border border-black text-right text-[11px]">{fmt(totals.opt)}</td>
    </tr>
  );

  return (
    <div>
      {/* Action buttons */}
      <div className="flex justify-end gap-3 mb-4 max-w-[850px] mx-auto print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 border border-[var(--card-border)] bg-[var(--section-bg)] text-[var(--text-main)] px-4 py-2 font-bold text-[12px] font-mono tracking-wider hover:bg-[var(--card-border)] transition-colors rounded-lg"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-[var(--primary-blue)] text-white px-4 py-2 font-bold text-[12px] font-mono tracking-wider hover:bg-[var(--primary-blue-hover)] transition-colors disabled:opacity-50 rounded-lg"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>

      {/* Printable document */}
      <div
        ref={printRef}
        className="pdf-export bg-white text-black max-w-[850px] mx-auto p-10 font-mono"
        style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
      >
        {/* TOP: Branding */}
        <div className="text-center mb-5">
          <div className="text-[13px] font-bold tracking-[6px] mb-1">★ ★ ★ PROPOSAL ★ ★ ★</div>
          <div className="text-[24px] font-extrabold tracking-wide leading-tight">Eastern Concrete Foundation, Inc.</div>
          <div className="text-[12px] mt-1 tracking-wide">Residential &nbsp;|&nbsp; Commercial &nbsp;|&nbsp; Industrial</div>
          <div className="text-[9px] mt-2 tracking-wide leading-tight">
            7950 PENN RANDALL PLACE, UPPER MARLBORO, MD 20772 &nbsp;-&nbsp; 301-736-1777 (OFFICE) 301-736-9098 (FAX) &nbsp;-&nbsp; WWW.EASTERNCONCRETE.COM
          </div>
        </div>

        <hr className="border-black border-t-2 mb-4" />

        {/* HEADER TABLE */}
        <table className="w-full border-collapse mb-1 text-[11px]">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-[3px] font-bold w-[100px]">Builder:</td>
              <td className="border border-black px-2 py-[3px]">{proposal.builder || "—"}</td>
              <td className="border border-black px-2 py-[3px] font-bold w-[65px]">Date:</td>
              <td className="border border-black px-2 py-[3px] w-[130px]">{proposal.date || "—"}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">Job Location:</td>
              <td className="border border-black px-2 py-[3px]">{proposal.location || "—"}</td>
              <td className="border border-black px-2 py-[3px] font-bold">County:</td>
              <td className="border border-black px-2 py-[3px]">{proposal.county || "—"}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-[3px] font-bold">Found. Type:</td>
              <td className="border border-black px-2 py-[3px]" colSpan={3}>{proposal.foundType || "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* Found Size + Column Headers row */}
        <table className="w-full border-collapse mb-0 text-[11px]">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-[3px] font-bold w-[100px]">Found. Size:</td>
              <td className="border border-black px-2 py-[3px]">{proposal.foundSize || "—"}</td>
              <td className="border border-black px-2 py-[3px] text-center font-bold w-[160px]" colSpan={2}>Standard</td>
              <td className="border border-black px-2 py-[3px] text-center font-bold w-[160px]" colSpan={2}>Optional</td>
            </tr>
          </tbody>
        </table>

        {/* LINE ITEMS TABLE */}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-gray-200 font-bold">
              <th className="border border-black px-2 py-[3px] text-center w-[55px]">QTY</th>
              <th className="border border-black px-2 py-[3px] text-center w-[45px]">UNIT</th>
              <th className="border border-black px-2 py-[3px] text-left">DESCRIPTION</th>
              <th className="border border-black px-2 py-[3px] text-right w-[75px]">UNIT $</th>
              <th className="border border-black px-2 py-[3px] text-right w-[85px]">TOTAL</th>
              <th className="border border-black px-2 py-[3px] text-right w-[75px]">UNIT $</th>
              <th className="border border-black px-2 py-[3px] text-right w-[85px]">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {/* Footings & Walls */}
            {allFtg.length > 0 && (
              <>
                {allFtg.map(renderLineRow)}
                {renderSubtotalRow("FTG & WALL", ftgTotals)}
              </>
            )}

            {/* Slabs */}
            {allSlab.length > 0 && (
              <>
                {allSlab.map(renderLineRow)}
                {renderSubtotalRow("SLABS", slabTotals)}
              </>
            )}

            {/* GRAND TOTAL */}
            <tr className="font-extrabold bg-gray-300">
              <td colSpan={4} className="px-2 py-1 border border-black text-right text-[12px] uppercase">GRAND TOTAL</td>
              <td className="px-2 py-1 border border-black text-right text-[12px]">{fmt(grandStd)}</td>
              <td className="px-2 py-1 border border-black text-right text-[12px]"></td>
              <td className="px-2 py-1 border border-black text-right text-[12px]">{fmt(grandOpt)}</td>
            </tr>
          </tbody>
        </table>

        {/* EXTRA CHARGES SECTION */}
        <div className="mt-6">
          <div className="text-[12px] font-extrabold underline mb-2">Extra Charges May Include</div>
          <table className="w-full border-collapse text-[10px]">
            <tbody>
              {extraCharges.map((ec, i) => (
                <tr key={i}>
                  <td className="border border-black px-2 py-[2px]">{ec.desc}</td>
                  <td className="border border-black px-2 py-[2px] text-right w-[120px] font-bold">{ec.rate}</td>
                  <td className="border border-black px-2 py-[2px] text-center w-[50px]">{ec.tbd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LEGAL FOOTER */}
        <div className="mt-6 text-[9px] leading-relaxed">
          The undersigned Contractor herewith agrees to furnish all labor, material and forms required to construct a poured concrete foundation(s) for a dwelling house(s) being constructed by Builder at the above job location. The unit prices all indicated are good for 30 days. The total given above represents our best estimate of quantities. However, the total job costs may change due to actual on site job conditions.
        </div>

        {/* BOTTOM */}
        <div className="text-center mt-5 text-[11px] font-extrabold tracking-widest">
          2009 &amp; 2014 MNCBIA Sub Contractor of the Year
        </div>
      </div>
    </div>
  );
}