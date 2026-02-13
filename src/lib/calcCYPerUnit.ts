// ── CONCRETE VOLUME CALCULATOR ──
// Returns { cy, wallCY, ftgCY, method } per unit
// DO NOT REFACTOR OR SIMPLIFY THIS FUNCTION
export function calcCYPerUnit(desc: string): { cy: number; wallCY: number; ftgCY: number; method: string | null } {
  if (!desc) return { cy: 0, wallCY: 0, ftgCY: 0, method: null };
  const d = desc.trim();
  const r = (wallCF: number, ftgCF: number, method: string) => {
    const wCY = wallCF / 27, fCY = ftgCF / 27;
    return { cy: wCY + fCY, wallCY: wCY, ftgCY: fCY, method };
  };

  // 1) Wall with footings: X' x Y" Wall - with A" x B" Footings
  const wallFtg = d.match(/^(\d+)'\s*x\s*(\d+)"\s*Wall\s*-\s*with\s*(\d+)"\s*x\s*(\d+)"\s*Foot/i);
  if (wallFtg) {
    const wallHt = parseFloat(wallFtg[1]);
    const wallThk = parseFloat(wallFtg[2]) / 12;
    const ftgW = parseFloat(wallFtg[3]) / 12;
    const ftgD = parseFloat(wallFtg[4]) / 12;
    return r(wallHt * wallThk, ftgW * ftgD, `Wall: ${wallFtg[1]}'x${wallFtg[2]}" + Ftg: ${wallFtg[3]}"x${wallFtg[4]}"`);
  }

  // 2) Wall ILO with dims: 8' x 8" Wall ILO 4' x 8" — all wall, no footing
  const wallILO = d.match(/^(\d+)'\s*x\s*(\d+)"\s*Wall\s*ILO\s*(\d+)'\s*x\s*(\d+)"/i);
  if (wallILO) {
    const extraHt = parseFloat(wallILO[1]) - parseFloat(wallILO[3]);
    const thk = parseFloat(wallILO[2]) / 12;
    return r(extraHt * thk, 0, `Extra ${extraHt}' x ${wallILO[2]}" thick`);
  }

  // 3) Generic ILO: "9' Walls ILO 8' Walls" — wall only
  const genericILO = d.match(/^(\d+)'\s*Walls?\s*ILO\s*(\d+)'\s*Walls?/i);
  if (genericILO) {
    const extraHt = parseFloat(genericILO[1]) - parseFloat(genericILO[2]);
    return r(extraHt * (8/12), 0, `Extra ${extraHt}' x 8" (assumed)`);
  }

  // 4) Walls only: "Walls: X' x Y"" — wall only
  const wallsColon = d.match(/^Walls:\s*(\d+)'\s*x\s*(\d+)"/i);
  if (wallsColon) {
    return r(parseFloat(wallsColon[1]) * (parseFloat(wallsColon[2])/12), 0, `Wall: ${wallsColon[1]}'x${wallsColon[2]}"`);
  }

  // 4b) "X' x Y" - Walls" — wall only
  const wallsDash = d.match(/^(\d+)'\s*x\s*(\d+)"\s*-\s*Walls/i);
  if (wallsDash) {
    return r(parseFloat(wallsDash[1]) * (parseFloat(wallsDash[2])/12), 0, `Wall: ${wallsDash[1]}'x${wallsDash[2]}"`);
  }

  // 5) Pier Pad — footing category
  const pier = d.match(/Pier\s*Pad:\s*(\d+)"\s*x\s*(\d+)"\s*x\s*(\d+)"/i);
  if (pier) {
    const cuFt = (parseFloat(pier[1])/12) * (parseFloat(pier[2])/12) * (parseFloat(pier[3])/12);
    return r(0, cuFt, `Pad: ${pier[1]}"x${pier[2]}"x${pier[3]}"`);
  }

  // 6) Column — wall category
  const col = d.match(/Column:\s*(\d+)"\s*x\s*(\d+)"\s*x\s*(\d+)"/i);
  if (col) {
    const cuFt = (parseFloat(col[1])/12) * (parseFloat(col[2])/12) * (parseFloat(col[3])/12);
    return r(cuFt, 0, `Col: ${col[1]}"x${col[2]}"x${col[3]}"`);
  }

  // 7) Grade Beam — footing category
  const gradeBeam = d.match(/Grade\s*Beam\s*-?\s*(\d+)"\s*x\s*(\d+)"/i);
  if (gradeBeam) {
    const cuFt = (parseFloat(gradeBeam[1])/12) * (parseFloat(gradeBeam[2])/12);
    return r(0, cuFt, `Beam: ${gradeBeam[1]}"x${gradeBeam[2]}"`);
  }

  // 8) Footings with dims — footing only
  const ftgOnly = d.match(/Footings?:?\s*(\d+)"\s*x\s*(\d+)"/i);
  if (ftgOnly && !d.match(/Wall/i)) {
    const cuFt = (parseFloat(ftgOnly[1])/12) * (parseFloat(ftgOnly[2])/12);
    return r(0, cuFt, `Ftg: ${ftgOnly[1]}"x${ftgOnly[2]}"`);
  }

  // 9) Frost Footing with dims — footing only
  const frost = d.match(/Frost\s*Footing\s*\(?(\d+)"\s*x\s*(\d+)"/i);
  if (frost) {
    const cuFt = (parseFloat(frost[1])/12) * (parseFloat(frost[2])/12);
    return r(0, cuFt, `Frost: ${frost[1]}"x${frost[2]}"`);
  }

  // 10) Generic frost footing — footing only
  if (/Frost\s*Footing/i.test(d) && !frost) {
    return r(0, (20/12) * (20/12), `Frost: 20"x20" (est.)`);
  }

  // 11) Slabs/Porch/etc with thickness — neither wall nor footing
  const slab = d.match(/(?:Slab|Porch|Apron|Driveway|Leadwalk)\s*-?\s*(\d+)"/i);
  if (slab) {
    return { cy: (parseFloat(slab[1])/12) / 27, wallCY: 0, ftgCY: 0, method: `${slab[1]}" slab` };
  }

  // 12) Slab - N" Thickness
  const slabThk = d.match(/Slab\s*-\s*(\d+)"\s*Thickness/i);
  if (slabThk) {
    return { cy: (parseFloat(slabThk[1])/12) / 27, wallCY: 0, ftgCY: 0, method: `${slabThk[1]}" slab` };
  }

  // 13) Generic slab/porch without thickness
  if (/(?:Basement\s*Slab|Garage\s*Slab|Front\s*Porch|Rear\s*Porch|Apron|Driveway|Leadwalk)\s*-?\s*$/i.test(d.replace(/,.*/, '').trim()) || /^(?:Basement\s*Slab|Garage\s*Slab|Front\s*Porch|Rear\s*Porch)\s*$/i.test(d.trim())) {
    return { cy: (4/12) / 27, wallCY: 0, ftgCY: 0, method: `4" slab (assumed)` };
  }

  // 14) Thickened Slab
  if (/Thickened\s*Slab/i.test(d)) {
    return { cy: (8/12) / 27, wallCY: 0, ftgCY: 0, method: `8" thick (est.)` };
  }

  // 15) Solid Footing Jump — footing category
  if (/Solid\s*Footing\s*Jump/i.test(d)) {
    return r(0, 2, `~2 cf each (est.)`);
  }

  // 16) Per Yard items — unknown split, put in wall
  if (/Per\s*Yard/i.test(d)) {
    return { cy: 1, wallCY: 0, ftgCY: 0, method: `1 CY direct` };
  }

  // 17) Areaway Landing — slab-like
  if (/Areaway\s*Landing/i.test(d)) {
    return { cy: 1, wallCY: 0, ftgCY: 0, method: `~1 CY (est.)` };
  }

  // 18) Areaway (wall)
  if (/^Areaway/i.test(d) && !/Landing/i.test(d)) {
    return r(4 * (8/12), 0, `4'x8" wall (est.)`);
  }

  // No concrete volume
  return { cy: 0, wallCY: 0, ftgCY: 0, method: null };
}
