import React, { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, Calculator, Scissors, Check, DollarSign, Layers } from 'lucide-react';

const COLOR_PALETTE = [
  ["#9FE1CB", "#0F6E56", "#04342C"],
  ["#CECBF6", "#534AB7", "#26215C"],
  ["#F5C4B3", "#993C1D", "#4A1B0C"],
  ["#FAC775", "#854F0B", "#412402"],
  ["#B5D4F4", "#185FA5", "#042C53"],
  ["#C0DD97", "#3B6D11", "#173404"]
];

const DEFAULT_PARTS = [
  { n: "A", w: 1.5, h: 4, f: 1, s: 1 },
  { n: "C", w: 4, h: 2, f: 0, s: 1 },
  { n: "D", w: 2, h: 1.5, f: 0, s: 1 },
  { n: "E", w: 2, h: 0.5, f: 0, s: 2 }
];

function ovl(a, b) {
  return a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.y < b.y + b.h - 1e-6 && b.y < a.y + a.h - 1e-6;
}

function qty(p, S) {
  return Math.max(0, Math.round((Number(p.f) || 0) + (Number(p.s) || 0) * S));
}

function fit(sh, w, h, rot) {
  let best = null;
  sh.free.forEach((f) => {
    const orientations = rot ? [[w, h], [h, w]] : [[w, h]];
    orientations.forEach((o) => {
      if (o[0] <= f.w + 1e-9 && o[1] <= f.h + 1e-9) {
        const s = Math.min(f.w - o[0], f.h - o[1]);
        if (!best || s < best.s) best = { s: s, x: f.x, y: f.y, w: o[0], h: o[1] };
      }
    });
  });
  return best;
}

function commit(sh, b) {
  const nf = [];
  sh.free.forEach((f) => {
    if (!ovl(f, b)) { nf.push(f); return; }
    if (b.x > f.x) nf.push({ x: f.x, y: f.y, w: b.x - f.x, h: f.h });
    if (b.x + b.w < f.x + f.w) nf.push({ x: b.x + b.w, y: f.y, w: f.x + f.w - b.x - b.w, h: f.h });
    if (b.y > f.y) nf.push({ x: f.x, y: f.y, w: f.w, h: b.y - f.y });
    if (b.y + b.h < f.y + f.h) nf.push({ x: f.x, y: b.y + b.h, w: f.w, h: f.y + f.h - b.y - b.h });
  });
  sh.free = nf.filter((a, i) =>
    !nf.some((bItem, j) =>
      i !== j && bItem.x <= a.x + 1e-9 && bItem.y <= a.y + 1e-9 &&
      bItem.x + bItem.w >= a.x + a.w - 1e-9 && bItem.y + bItem.h >= a.y + a.h - 1e-9 &&
      (i > j || a.w !== bItem.w || a.h !== bItem.h || a.x !== bItem.x || a.y !== bItem.y)
    )
  );
}

function once(order, W, H, rot) {
  const sheets = [];
  let skip = 0;
  order.forEach((it) => {
    let b = null;
    let sh = null;
    for (let i = 0; i < sheets.length && !b; i++) {
      b = fit(sheets[i], it.w, it.h, rot);
      if (b) sh = sheets[i];
    }
    if (!b) {
      const ns = { free: [{ x: 0, y: 0, w: W, h: H }], items: [] };
      b = fit(ns, it.w, it.h, rot);
      if (!b) { skip++; return; }
      sheets.push(ns);
      sh = ns;
    }
    commit(sh, b);
    sh.items.push({ n: it.n, c: it.c, w: b.w, h: b.h, x: b.x, y: b.y });
  });
  return { sheets: sheets.map(s => s.items), skip: skip };
}

function area(sh) {
  return sh.reduce((s, p) => s + p.w * p.h, 0);
}

function bestPacking(items, W, H, rot) {
  if (items.length === 0) return { sheets: [], skip: 0, low: 0 };
  const tr = Math.max(8, Math.min(300, Math.floor(4000 / Math.max(1, items.length))));
  let b = null;
  for (let t = 0; t < tr; t++) {
    const o = items.slice();
    if (t === 0) o.sort((a, c) => c.w * c.h - a.w * a.h);
    else if (t === 1) o.sort((a, c) => Math.max(c.w, c.h) - Math.max(a.w, a.h) || c.w * c.h - a.w * a.h);
    else {
      for (let i = o.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const x = o[i]; o[i] = o[j]; o[j] = x;
      }
    }
    const r = once(o, W, H, rot);
    r.low = Math.min(...r.sheets.map(area).concat([1e9]));
    if (!b || r.skip < b.skip || (r.skip === b.skip && (r.sheets.length < b.sheets.length || (r.sheets.length === b.sheets.length && r.low < b.low)))) {
      b = r;
    }
  }
  return b;
}

function cutsSummary(sh) {
  const o = {};
  const a = [];
  sh.forEach((p) => {
    const k = `${p.n} (${p.w}′×${p.h}′)`;
    o[k] = (o[k] || 0) + 1;
  });
  for (let k in o) a.push(`${o[k]} × ${k}`);
  return a.join(", ");
}

export const SeatSetCuttingModule = () => {
  // Input states
  const [seats, setSeats] = useState(1);
  const [sets, setSets] = useState(1);
  const [sw, setSw] = useState(8);
  const [sh, setSh] = useState(4);
  const [rot, setRot] = useState(true);

  // Parts state
  const [parts, setParts] = useState(DEFAULT_PARTS);

  // Cost & Advance parameters
  const [mr, setMr] = useState(75);
  const [mb, setMb] = useState('sheets'); // 'sheets' or 'used'
  const [it, setIt] = useState(0);
  const [em, setEm] = useState(300);
  const [lab, setLab] = useState(1500);
  const [fx, setFx] = useState(0);
  const [mg, setMg] = useState(15);
  const [gst, setGst] = useState(0);
  const [adv, setAdv] = useState(50);
  const [rec, setRec] = useState(0);

  const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '1.5rem' };
  const inputStyle = { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: '#f8fafc', color: '#0f172a' };
  const labelStyle = { display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' };

  // Calculate items array
  const buildItems = (S, N) => {
    const items = [];
    parts.forEach((p, i) => {
      const q = qty(p, S) * N;
      for (let k = 0; k < q; k++) {
        items.push({ n: p.n, w: Number(p.w) || 0, h: Number(p.h) || 0, c: i });
      }
    });
    return items;
  };

  // Perform packing & cost calculation
  const calcResults = useMemo(() => {
    const S = Math.max(1, Math.floor(Number(seats) || 1));
    const N = Math.max(1, Math.floor(Number(sets) || 1));
    const W = Math.max(0.1, Number(sw) || 8);
    const H = Math.max(0.1, Number(sh) || 4);
    const sheetArea = W * H;

    const one = bestPacking(buildItems(S, 1), W, H, rot);
    let list = one.sheets;
    let counts = list.map(() => N);
    let skip = one.skip;

    if (N > 1) {
      const g = bestPacking(buildItems(S, N), W, H, rot);
      if (g.skip === 0 && g.sheets.length < list.length * N) {
        list = g.sheets;
        counts = list.map(() => 1);
        skip = 0;
      }
    }

    const nS = counts.reduce((a, b) => a + b, 0);
    let usedSqFt = 0;
    list.forEach((sheet, idx) => {
      usedSqFt += area(sheet) * counts[idx];
    });

    const totalPieces = buildItems(S, N).length;
    const totalSheetSqFt = nS * sheetArea;
    const leftoverSqFt = Math.max(0, totalSheetSqFt - usedSqFt);
    const usagePercent = totalSheetSqFt > 0 ? (usedSqFt / totalSheetSqFt) * 100 : 0;
    const sqFtPerSeat = (S * N) > 0 ? usedSqFt / (S * N) : 0;

    // Financial calculations
    const seatsAll = S * N;
    const materialRate = Number(mr) || 0;
    const matSqFt = mb === 'used' ? usedSqFt : totalSheetSqFt;
    const matCost = matSqFt * materialRate;
    const importCost = nS * (Number(it) || 0);
    const extraMatCost = seatsAll * (Number(em) || 0);
    const labourCost = seatsAll * (Number(lab) || 0);
    const fixedCost = Number(fx) || 0;

    const baseTotalCost = matCost + importCost + extraMatCost + labourCost + fixedCost;
    const marginPerc = Number(mg) || 0;
    const marginAmount = baseTotalCost * (marginPerc / 100);
    const subtotal = baseTotalCost + marginAmount;

    const gstPerc = Number(gst) || 0;
    const gstAmount = subtotal * (gstPerc / 100);
    const totalSellingPrice = subtotal + gstAmount;

    const advPerc = Math.min(100, Math.max(0, Number(adv) || 0));
    const advanceAsked = totalSellingPrice * (advPerc / 100);
    const advanceRec = Number(rec) || 0;
    const advanceDue = Math.max(0, advanceAsked - advanceRec);
    const balanceRemaining = totalSellingPrice - Math.max(advanceAsked, advanceRec);

    return {
      S, N, W, H, sheetArea,
      list, counts, skip, nS,
      totalPieces, usedSqFt, totalSheetSqFt, leftoverSqFt, usagePercent, sqFtPerSeat,
      seatsAll, materialRate, matSqFt, matCost, importCost, extraMatCost, labourCost, fixedCost,
      baseTotalCost, marginPerc, marginAmount, subtotal, gstPerc, gstAmount, totalSellingPrice,
      advPerc, advanceAsked, advanceRec, advanceDue, balanceRemaining
    };
  }, [seats, sets, sw, sh, rot, parts, mr, mb, it, em, lab, fx, mg, gst, adv, rec]);

  const handlePartChange = (idx, key, val) => {
    const updated = [...parts];
    if (key === 'n') updated[idx].n = val || '?';
    else updated[idx][key] = Math.max(0, parseFloat(val) || 0);
    setParts(updated);
  };

  const handleAddPart = () => {
    const nextChar = String.fromCharCode(65 + parts.length);
    setParts([...parts, { n: nextChar, w: 2, h: 2, f: 0, s: 1 }]);
  };

  const handleDeletePart = (idx) => {
    if (parts.length <= 1) return;
    setParts(parts.filter((_, i) => i !== idx));
  };

  const handleResetDefaults = () => {
    setSeats(1);
    setSets(1);
    setSw(8);
    setSh(4);
    setRot(true);
    setParts(DEFAULT_PARTS);
    setMr(75);
    setMb('sheets');
    setIt(0);
    setEm(300);
    setLab(1500);
    setFx(0);
    setMg(15);
    setGst(0);
    setAdv(50);
    setRec(0);
  };

  const mFmt = (val) => `₹ ${Math.round(val).toLocaleString('en-IN')}`;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Module Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scissors size={24} color="#0f6e56" /> Seat Set Cutting & Advance Calculator
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            2D Sheet cutting optimization, piece allocation, and cost estimation for seat manufacturing.
          </p>
        </div>
        <button
          onClick={handleResetDefaults}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <RotateCcw size={16} /> Reset Defaults
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Dimensions & Parts Setup */}
        <div>
          {/* Card 1: Sheet & Quantity Config */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 1rem 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#0f6e56" /> Sheet & Set Configuration
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Seats Per Set</label>
                <input type="number" min="1" step="1" style={inputStyle} value={seats} onChange={e => setSeats(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Number of Sets</label>
                <input type="number" min="1" step="1" style={inputStyle} value={sets} onChange={e => setSets(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Sheet Length (ft)</label>
                <input type="number" min="0.5" step="0.25" style={inputStyle} value={sw} onChange={e => setSw(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Sheet Width (ft)</label>
                <input type="number" min="0.5" step="0.25" style={inputStyle} value={sh} onChange={e => setSh(e.target.value)} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.875rem', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={rot} onChange={e => setRot(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0f6e56' }} />
              Allow rotating pieces (90° turn)
            </label>
          </div>

          {/* Card 2: Parts Table */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                Pieces Specification
              </h3>
              <button
                onClick={handleAddPart}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', backgroundColor: '#0f6e56', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={14} /> Add Piece
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '0.5rem 0.25rem' }}>Name</th>
                    <th style={{ padding: '0.5rem 0.25rem' }}>Len (ft)</th>
                    <th style={{ padding: '0.5rem 0.25rem' }}>Wid (ft)</th>
                    <th style={{ padding: '0.5rem 0.25rem' }}>Fixed</th>
                    <th style={{ padding: '0.5rem 0.25rem' }}>Per Seat</th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '32px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.35rem 0.25rem' }}>
                        <input
                          type="text"
                          value={p.n}
                          onChange={e => handlePartChange(idx, 'n', e.target.value)}
                          style={{ width: '50px', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center', fontWeight: 600 }}
                        />
                      </td>
                      <td style={{ padding: '0.35rem 0.25rem' }}>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={p.w}
                          onChange={e => handlePartChange(idx, 'w', e.target.value)}
                          style={{ width: '55px', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.35rem 0.25rem' }}>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={p.h}
                          onChange={e => handlePartChange(idx, 'h', e.target.value)}
                          style={{ width: '55px', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.35rem 0.25rem' }}>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={p.f}
                          onChange={e => handlePartChange(idx, 'f', e.target.value)}
                          style={{ width: '50px', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.35rem 0.25rem' }}>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={p.s}
                          onChange={e => handlePartChange(idx, 's', e.target.value)}
                          style={{ width: '50px', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.35rem 0.25rem' }}>
                        {parts.length > 1 && (
                          <button
                            onClick={() => handleDeletePart(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.775rem', color: '#64748b', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              For {calcResults.S} seat{calcResults.S > 1 ? 's' : ''}: {parts.map(p => `${qty(p, calcResults.S)} × ${p.n}`).join(', ')}
            </div>
          </div>

          {/* Card 3: Cost Inputs */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 1rem 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={18} color="#0f6e56" /> Cost & Commercial Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Material Rate (/sq ft)</label>
                <input type="number" min="0" style={inputStyle} value={mr} onChange={e => setMr(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Material Counted On</label>
                <select style={inputStyle} value={mb} onChange={e => setMb(e.target.value)}>
                  <option value="sheets">Full Sheets Bought</option>
                  <option value="used">Only Sq Ft Used</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Import Transport (/sheet)</label>
                <input type="number" min="0" style={inputStyle} value={it} onChange={e => setIt(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Extra Material (/seat)</label>
                <input type="number" min="0" style={inputStyle} value={em} onChange={e => setEm(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Labour Cost (/seat)</label>
                <input type="number" min="0" style={inputStyle} value={lab} onChange={e => setLab(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Other Fixed Cost (₹)</label>
                <input type="number" min="0" style={inputStyle} value={fx} onChange={e => setFx(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Your Margin %</label>
                <input type="number" min="0" style={inputStyle} value={mg} onChange={e => setMg(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>GST %</label>
                <input type="number" min="0" style={inputStyle} value={gst} onChange={e => setGst(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Advance %</label>
                <input type="number" min="0" max="100" style={inputStyle} value={adv} onChange={e => setAdv(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Already Received (₹)</label>
                <input type="number" min="0" style={inputStyle} value={rec} onChange={e => setRec(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Layout & Results */}
        <div>
          {/* Key Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>Total Pieces</span>
              <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>{calcResults.totalPieces}</strong>
            </div>
            <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>Sheets Needed</span>
              <strong style={{ fontSize: '1.25rem', color: '#0f6e56' }}>{calcResults.nS}</strong>
            </div>
            <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>Used Sq Ft</span>
              <strong style={{ fontSize: '1.25rem', color: '#2563eb' }}>{calcResults.usedSqFt.toFixed(1)}</strong>
            </div>
            <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>Leftover Sq Ft</span>
              <strong style={{ fontSize: '1.25rem', color: '#d97706' }}>{calcResults.leftoverSqFt.toFixed(1)}</strong>
            </div>
          </div>

          {/* Big Advance Banner */}
          <div style={{ backgroundColor: '#e1f5ee', border: '2px solid #0f6e56', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#0f6e56', fontWeight: 600 }}>ADVANCE TO ASK FROM CUSTOMER</span>
            <strong style={{ display: 'block', fontSize: '2.25rem', color: '#04342c', fontWeight: 800, margin: '0.2rem 0' }}>
              {mFmt(calcResults.advanceDue)}
            </strong>
            <span style={{ fontSize: '0.8rem', color: '#0f6e56' }}>
              {calcResults.advanceRec > 0 ? `Total Advance: ${mFmt(calcResults.advanceAsked)} (Already received: ${mFmt(calcResults.advanceRec)})` : `${calcResults.advPerc}% of Total Price (${mFmt(calcResults.totalSellingPrice)})`}
            </span>
          </div>

          {/* Sheet Visual Cutting Results */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
              Cutting Layout Preview
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Total Sheet area {calcResults.totalSheetSqFt.toFixed(1)} sq ft ({calcResults.nS} × {calcResults.sheetArea} sq ft). Efficiency: <strong>{calcResults.usagePercent.toFixed(1)}%</strong>
            </p>

            {calcResults.skip > 0 && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.8rem', marginBottom: '1rem' }}>
                ⚠️ {calcResults.skip} piece(s) are larger than sheet size ({calcResults.W}′ × {calcResults.H}′) and could not fit!
              </div>
            )}

            {calcResults.list.slice(0, 10).map((sheet, sIdx) => {
              const count = calcResults.counts[sIdx];
              const sheetUsed = area(sheet);
              const sheetLeft = calcResults.sheetArea - sheetUsed;
              const scale = 320 / calcResults.W; // Scale for 320px width preview

              return (
                <div key={sIdx} style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                    <span>Sheet {sIdx + 1} {count > 1 ? `(Make ${count} sheets like this)` : ''}</span>
                    <span style={{ color: '#64748b' }}>Used: {sheetUsed.toFixed(1)} / Leftover: {sheetLeft.toFixed(1)} sq ft</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.5rem' }}>
                    {cutsSummary(sheet)}
                  </div>

                  {/* Canvas Container */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: `${calcResults.H * scale}px`,
                    border: '2px solid #334155',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    backgroundImage: 'linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)',
                    backgroundSize: `${scale}px ${scale}px`,
                    overflow: 'hidden'
                  }}>
                    {sheet.map((p, pIdx) => {
                      const color = COLOR_PALETTE[p.c % COLOR_PALETTE.length];
                      const px = p.x * scale;
                      const py = p.y * scale;
                      const pw = p.w * scale;
                      const ph = p.h * scale;

                      return (
                        <div
                          key={pIdx}
                          title={`${p.n} ${p.w}′ × ${p.h}′`}
                          style={{
                            position: 'absolute',
                            left: `${px}px`,
                            top: `${py}px`,
                            width: `${pw}px`,
                            height: `${ph}px`,
                            backgroundColor: color[0],
                            border: `1px solid ${color[1]}`,
                            color: color[2],
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: `${Math.max(9, Math.min(12, Math.min(pw, ph) / 2.4))}px`,
                            fontWeight: 'bold',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            lineHeight: 1.1
                          }}
                        >
                          {pw >= 16 && ph >= 12 && <span>{p.n}</span>}
                          {pw >= 50 && ph >= 28 && <span style={{ fontSize: '8px', fontWeight: 'normal', opacity: 0.85 }}>{p.w}′×{p.h}′</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Complete Breakdown Table */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 1rem 0', fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              Full Commercial Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span>Material ({calcResults.matSqFt.toFixed(1)} sq ft × {mFmt(calcResults.materialRate)})</span>
                <b>{mFmt(calcResults.matCost)}</b>
              </div>
              {calcResults.importCost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                  <span>Import Transport ({calcResults.nS} sheets)</span>
                  <b>{mFmt(calcResults.importCost)}</b>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span>Extra Material ({calcResults.seatsAll} seats)</span>
                <b>{mFmt(calcResults.extraMatCost)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span>Labour Cost ({calcResults.seatsAll} seats)</span>
                <b>{mFmt(calcResults.labourCost)}</b>
              </div>
              {calcResults.fixedCost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                  <span>Other Fixed Cost</span>
                  <b>{mFmt(calcResults.fixedCost)}</b>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #cbd5e1', fontWeight: 600, color: '#334155' }}>
                <span>Base Total Cost</span>
                <span>{mFmt(calcResults.baseTotalCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span>Your Margin ({calcResults.marginPerc}%)</span>
                <b>{mFmt(calcResults.marginAmount)}</b>
              </div>
              {calcResults.gstPerc > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                  <span>GST ({calcResults.gstPerc}%)</span>
                  <b>{mFmt(calcResults.gstAmount)}</b>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '2px solid #0f6e56', fontSize: '1.05rem', fontWeight: 800, color: '#0f6e56' }}>
                <span>Selling Price</span>
                <span>{mFmt(calcResults.totalSellingPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#64748b' }}>
                <span>Price per Seat ({calcResults.seatsAll} seats)</span>
                <b>{mFmt(calcResults.totalSellingPrice / Math.max(1, calcResults.seatsAll))}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#64748b' }}>
                <span>Price per Sq Ft Used</span>
                <b>{mFmt(calcResults.totalSellingPrice / Math.max(1, calcResults.usedSqFt))}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderTop: '1px solid #e2e8f0', color: '#2563eb', fontWeight: 600 }}>
                <span>Total Advance ({calcResults.advPerc}%)</span>
                <span>{mFmt(calcResults.advanceAsked)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#475569' }}>
                <span>Balance After Advance</span>
                <b>{mFmt(calcResults.balanceRemaining)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSetCuttingModule;
