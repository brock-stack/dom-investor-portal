// Fetches Freddie Mac PMMS CSV and returns the latest 30yr + 15yr fixed rates.
// 5/1 ARM retired by Freddie Mac in 2022 — rate51 returned as null.
// Hourly CDN cache (PMMS publishes weekly on Thursdays).

exports.handler = async function() {
  try {
    const res = await fetch('https://www.freddiemac.com/pmms/docs/PMMS_history.csv', {
      headers: { 'User-Agent': 'DOM-Investor-Portal/1.0' }
    });
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'upstream ' + res.status }) };
    }
    const csv = await res.text();
    const lines = csv.trim().split(/\r?\n/);
    // lines[0] is the header; data rows start at index 1.
    // Walk backwards to find the last two rows with a non-empty pmms30 value.
    let latestRow = null;
    let prevRow = null;
    for (let i = lines.length - 1; i > 0; i--) {
      const cols = lines[i].split(',');
      if (cols[1] && cols[1].trim()) {
        if (!latestRow) { latestRow = cols; }
        else if (!prevRow) { prevRow = cols; break; }
      }
    }
    if (!latestRow) {
      return { statusCode: 502, body: JSON.stringify({ error: 'no valid PMMS rows found in CSV' }) };
    }

    // CSV columns: date, pmms30, pmms30p, pmms15, pmms15p, pmms51, ...
    const [date, pmms30, , pmms15, , pmms51] = latestRow;

    // Reformat M/D/YYYY → YYYY-MM-DD
    const dateParts = date.trim().split('/');
    const [m, d, y] = dateParts;
    const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

    const result = {
      date: isoDate,
      rate30: pmms30 && pmms30.trim() ? parseFloat(pmms30).toFixed(2) : null,
      rate15: pmms15 && pmms15.trim() ? parseFloat(pmms15).toFixed(2) : null,
      rate51: pmms51 && pmms51.trim() ? parseFloat(pmms51).toFixed(2) : null
    };

    // Week-over-week change
    if (prevRow) {
      const prev30 = parseFloat(prevRow[1]);
      const prev15 = parseFloat(prevRow[3]);
      if (!isNaN(prev30) && result.rate30) {
        result.change30 = (parseFloat(result.rate30) - prev30).toFixed(2);
      }
      if (!isNaN(prev15) && result.rate15) {
        result.change15 = (parseFloat(result.rate15) - prev15).toFixed(2);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (e) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: e.message || 'unknown error' })
    };
  }
};
