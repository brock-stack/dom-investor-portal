// netlify/functions/mortgage-rates.js
// v2.3.2 — Robust CSV parsing for Freddie Mac PMMS (handles quoted + unquoted rows).
// Previous version assumed unquoted CSV and produced NaN rates + undefined date.

const SOURCE = 'https://www.freddiemac.com/pmms/docs/PMMS_history.csv';

function stripQuotes(s) {
  if (typeof s !== 'string') return s;
  return s.trim().replace(/^"+|"+$/g, '');
}

function parseRow(line) {
  // Naive CSV split is fine here — no embedded commas inside quoted fields in this dataset.
  return line.split(',').map(stripQuotes);
}

function toIsoDate(mdyStr) {
  // Input: "6/11/2026" (or "6/4/2026"). Output: "2026-06-11" (ISO YYYY-MM-DD).
  if (!mdyStr) return null;
  const parts = mdyStr.split('/');
  if (parts.length !== 3) return null;
  const m = parseInt(parts[0], 10);
  const d = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (!Number.isFinite(m) || !Number.isFinite(d) || !Number.isFinite(y)) return null;
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return y + '-' + mm + '-' + dd;
}

function num(s) {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

exports.handler = async function() {
  try {
    const resp = await fetch(SOURCE);
    if (!resp.ok) throw new Error('Freddie Mac CSV fetch failed: ' + resp.status);
    const text = await resp.text();
    const lines = text.split(/\r?\n/).filter(function(l) { return l.trim().length > 0; });
    if (lines.length < 2) throw new Error('Empty CSV');

    // Find the last data row (skip the header).
    const lastTwo = lines.slice(-2); // last + second-to-last for weekly delta
    const lastCells = parseRow(lastTwo[lastTwo.length - 1]);
    const prevCells = lastTwo.length > 1 ? parseRow(lastTwo[0]) : null;

    // Header schema: date, pmms30, pmms30p, pmms15, pmms15p, pmms51, pmms51p, pmms51m, pmms51spread
    const date = toIsoDate(lastCells[0]);
    const rate30 = num(lastCells[1]);
    const rate15 = num(lastCells[3]);
    const rate51 = num(lastCells[5]);

    let change30 = null, change15 = null;
    if (prevCells) {
      const prev30 = num(prevCells[1]);
      const prev15 = num(prevCells[3]);
      if (rate30 != null && prev30 != null) change30 = +(rate30 - prev30).toFixed(2);
      if (rate15 != null && prev15 != null) change15 = +(rate15 - prev15).toFixed(2);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // 1 hour
      },
      body: JSON.stringify({
        date: date,       // ISO YYYY-MM-DD string, e.g. "2026-06-11"
        rate30: rate30,   // number, e.g. 6.52
        rate15: rate15,   // number, e.g. 5.84
        rate51: rate51,   // number or null
        change30: change30, // number (delta vs previous week), or null
        change15: change15,
        source: 'Freddie Mac PMMS'
      })
    };
  } catch (e) {
    return {
      statusCode: 200, // soft-fail so the page renders; frontend has its own fallback
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: null,
        rate30: null,
        rate15: null,
        rate51: null,
        change30: null,
        change15: null,
        source: 'Freddie Mac PMMS',
        error: String(e && e.message || e)
      })
    };
  }
};
