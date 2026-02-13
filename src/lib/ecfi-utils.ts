import { calcCYPerUnit } from "./calcCYPerUnit";

export const UNIT_OPTIONS = ["LF", "SF", "EA", "CY", "HR", "LS"] as const;
export type UnitOption = typeof UNIT_OPTIONS[number];

export interface LineItem {
  id: string;
  qty: string;
  unit: string;
  description: string;
  unitPriceStd: string;
  unitPriceOpt: string;
  section: "ftg" | "slab";
  cyOverride: string;
}

export interface ProposalData {
  id?: string;
  builder: string;
  date: string;
  location: string;
  county: string;
  foundType: string;
  foundSize: string;
  concretePerYard: string;
  laborPerYard: string;
  otherCosts: string;
}

export const emptyLine = (): LineItem => ({
  id: crypto.randomUUID(),
  qty: "",
  unit: "LF",
  description: "",
  unitPriceStd: "",
  unitPriceOpt: "",
  section: "ftg",
  cyOverride: "",
});

export const emptySlabLine = (): LineItem => ({
  ...emptyLine(),
  unit: "SF",
  section: "slab",
});

export const fmt = (n: number | string): string => {
  if (n === "" || n === null || n === undefined || isNaN(Number(n))) return "";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtCurrency = (n: number): string =>
  "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const calcSection = (lines: LineItem[]) => {
  let std = 0, opt = 0;
  lines.forEach((l) => {
    if (l.qty && l.unitPriceStd) std += parseFloat(l.qty) * parseFloat(l.unitPriceStd);
    if (l.qty && l.unitPriceOpt) opt += parseFloat(l.qty) * parseFloat(l.unitPriceOpt);
  });
  return { std, opt };
};

export const calcTotalYards = (lines: LineItem[]): number =>
  lines.reduce((sum, l) => {
    if (!l.qty) return sum;
    if (l.cyOverride !== "") return sum + (parseFloat(l.cyOverride) || 0);
    return sum + (parseFloat(l.qty) * calcCYPerUnit(l.description).cy);
  }, 0);

export const calcVolumeSplit = (lines: LineItem[]) => {
  let wall = 0, ftg = 0, slab = 0, other = 0;
  lines.forEach((l) => {
    if (!l.qty) return;
    const qty = parseFloat(l.qty);
    if (l.cyOverride !== "") {
      other += parseFloat(l.cyOverride) || 0;
      return;
    }
    const vc = calcCYPerUnit(l.description);
    wall += qty * vc.wallCY;
    ftg += qty * vc.ftgCY;
    const remainder = (qty * vc.cy) - (qty * vc.wallCY) - (qty * vc.ftgCY);
    if (remainder > 0.001) slab += remainder;
  });
  return { wall, ftg, slab, other, total: wall + ftg + slab + other };
};
