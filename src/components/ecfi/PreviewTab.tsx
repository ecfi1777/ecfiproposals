import { useRef, useState } from "react";
import { LineItem, calcSection, calcTotalYards, fmt, fmtCurrency } from "@/lib/ecfi-utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download } from "lucide-react";

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

export function PreviewTab({ proposal, ftgLines, slabLines }: PreviewTabProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const allFtg = ftgLines.filter((l) => l.description);
  const allSlab = slabLines.filter((l) => l.description);
  const ftgTotals = calcSection(ftgLines);
  const slabTotals = calcSection(slabLines);
  const grandStd = ftgTotals.std + slabTotals.std;
  const grandOpt = ftgTotals.opt + slabTotals.opt;

  const sections = [
    { label: "Footings & Walls", lines: allFtg, totals: ftgTotals, tag: "FTG & WALL" },
    { label: "Slabs", lines: allSlab, totals: slabTotals, tag: "SLABS" },
  ].filter((s) => s.lines.length > 0);

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

  return (
    <div>
      {/* Export button */}
      <div className="flex justify-end mb-4 max-w-[900px] mx-auto">
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-ecfi-gold text-primary-foreground px-4 py-2 font-bold text-[12px] font-mono tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>

      <div ref={printRef} className="bg-white text-black border border-ecfi-preview-border p-8 max-w-[900px] mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-[11px] tracking-[4px] text-[#c5960a] font-bold mb-1">★ ★ ★ PROPOSAL ★ ★ ★</div>
          <div className="text-[22px] font-extrabold text-black tracking-wider">Eastern Concrete Foundation, Inc.</div>
          <div className="text-[12px] text-gray-500 mt-1">Residential | Commercial | Industrial</div>
          <div className="text-[10px] text-gray-400 mt-1">
            7950 Penn Randall Place, Upper Marlboro, MD 20772 • 301-736-1777 • www.easternconcrete.com
          </div>
        </div>

        {/* Project details */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-gray-50 border border-gray-200">
          {[
            ["Builder:", proposal.builder],
            ["Date:", proposal.date],
            ["Job Location:", proposal.location],
            ["County:", proposal.county],
            ["Found. Type:", proposal.foundType],
            ["Found. Size:", proposal.foundSize],
          ].map(([lbl, val], i) => (
            <div key={i}>
              <span className="text-gray-400 text-[10px] uppercase tracking-wider">{lbl} </span>
              <span className="text-black text-sm font-semibold">{val || "—"}</span>
            </div>
          ))}
        </div>

        {/* Line item tables */}
        {sections.map((sec, si) => (
          <div key={si}>
            <div className="text-[12px] font-extrabold text-[#c5960a] tracking-widest mb-2 mt-5 uppercase">{sec.label}</div>
            <table className="w-full border-collapse mb-2">
              <thead>
                <tr>
                  {["QTY", "UNIT", "DESCRIPTION", "STD $", "STD TOT", "OPT $", "OPT TOT"].map((h, i) => (
                    <th
                      key={i}
                      className={`font-mono text-[10px] px-2 py-1.5 border-b-2 border-gray-300 text-gray-500 font-bold uppercase tracking-wider ${
                        i === 0 || i >= 3 ? "text-right" : "text-left"
                      }`}
                      style={{ width: i === 0 ? 50 : i === 1 ? 40 : i >= 3 ? [70, 90, 70, 90][i - 3] : undefined }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sec.lines.map((l, i) => {
                  const ts = l.qty && l.unitPriceStd ? parseFloat(l.qty) * parseFloat(l.unitPriceStd) : 0;
                  const to = l.qty && l.unitPriceOpt ? parseFloat(l.qty) * parseFloat(l.unitPriceOpt) : 0;
                  return (
                    <tr key={i}>
                      <td className="font-mono text-[12px] px-2 py-1 border-b border-gray-200 text-right">{l.qty}</td>
                      <td className="font-mono text-[12px] px-2 py-1 border-b border-gray-200">{l.unit}</td>
                      <td className="font-mono text-[12px] px-2 py-1 border-b border-gray-200">{l.description}</td>
                      <td className="font-mono text-[12px] px-2 py-1 border-b border-gray-200 text-right">{l.unitPriceStd ? fmt(parseFloat(l.unitPriceStd)) : "-"}</td>
                      <td className="font-mono text-[12px] px-2 py-1 border-b border-gray-200 text-right text-[#2d8a4e]">{ts ? fmt(ts) : "-"}</td>
                      <td className="font-mono text-[12px] px-2 py-1 border-b border-gray-200 text-right">{l.unitPriceOpt ? fmt(parseFloat(l.unitPriceOpt)) : "-"}</td>
                      <td className="font-mono text-[12px] px-2 py-1 border-b border-gray-200 text-right text-[#c5960a]">{to ? fmt(to) : "-"}</td>
                    </tr>
                  );
                })}
                <tr className="font-bold">
                  <td colSpan={4} className="font-mono text-[12px] px-2 py-1 border-b-2 border-gray-300 text-right text-gray-500">
                    {sec.tag}
                  </td>
                  <td className="font-mono text-[12px] px-2 py-1 border-b-2 border-gray-300 text-right text-[#2d8a4e]">{fmt(sec.totals.std)}</td>
                  <td className="font-mono text-[12px] px-2 py-1 border-b-2 border-gray-300" />
                  <td className="font-mono text-[12px] px-2 py-1 border-b-2 border-gray-300 text-right text-[#c5960a]">{fmt(sec.totals.opt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Grand totals */}
        <div className="flex justify-end gap-10 py-4 border-t-2 border-[#c5960a] mt-4">
          <div className="text-right">
            <div className="text-[10px] text-gray-500 tracking-wider uppercase">Grand Total (Standard)</div>
            <div className="text-[22px] font-extrabold text-[#2d8a4e]">{fmtCurrency(grandStd)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 tracking-wider uppercase">Grand Total (Optional)</div>
            <div className="text-[22px] font-extrabold text-[#c5960a]">{fmtCurrency(grandOpt)}</div>
          </div>
        </div>

        {/* Extra charges */}
        <div className="mt-5 p-4 bg-gray-50 border border-gray-200">
          <div className="text-[10px] text-gray-500 tracking-wider font-bold mb-2 uppercase">Extra Charges May Include</div>
          <div className="text-[11px] text-gray-400 leading-relaxed">
            *** Concrete Pump - Cost + 5% or Flat Rate — Avg $850/EA<br />
            *** Extra Concrete In Footing Due to Ground Condition — $350/YARD<br />
            *** Extra Labor — $185/HOUR<br />
            *** Winter Concrete - Hot Water (Mid Nov - Mid Apr) — $4.25/YARD<br />
            *** 1% High Early (Mid Nov - Mid Apr, Under 45°) — $5.75/YARD
          </div>
        </div>

        {/* Legal footer */}
        <div className="mt-4 text-[10px] text-gray-400 leading-relaxed italic">
          The undersigned Contractor herewith agrees to furnish all labor, material and forms required to construct a poured concrete foundation(s) for a dwelling house(s) being constructed by Builder at the above job location. The unit prices all indicated are good for 30 days. The total given above represents our best estimate of quantities. However, the total job costs may change due to actual on site job conditions.
        </div>
        <div className="text-center mt-4 text-[11px] text-[#c5960a] font-bold tracking-widest">
          2009 & 2014 MNCBIA Sub Contractor of the Year
        </div>
      </div>
    </div>
  );
}
