(function () {
const W = window.W23, $ = s => document.querySelector(s);
const S = { holdings: {}, reportDate: null, clients: [], files: { h: [], c: null }, filter: '' };
const el = (t, a, ...kids) => { const e = document.createElement(t); for (const k in (a || {})) { if (k === 'class') e.className = a[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), a[k]); else if (k === 'html') e.innerHTML = a[k]; else e.setAttribute(k, a[k]); } kids.flat().forEach(c => e.append(c)); return e; };
const num = v => { const n = parseFloat(String(v).replace(/[$,\s]/g, '')); return isNaN(n) ? 0 : n; };

// ---------- CSV ----------
function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows;
}
function loadHoldingsText(text, name) {
  const rows = parseCSV(text);
  let hi = rows.findIndex(r => r[0] === 'Account name');
  if (hi < 0) throw new Error(name + ': no "Account name" header row found. Is this a Panorama Client Holdings CSV?');
  const hdr = rows[hi]; const ix = k => hdr.indexOf(k);
  const iAcc = ix('Account number'), iType = ix('Asset type'), iCode = ix('Asset code'), iVal = ix('Value'), iName = ix('Account name'), iAdv = ix('Adviser Name');
  const dl = rows.find(r => /^As at date/i.test(r[0]));
  if (dl && dl[1]) { const m = dl[1].trim().match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{2,4})/); if (m) { const mi = W.MONTHS.findIndex(x => x.slice(0, 3).toLowerCase() === m[2].toLowerCase()); const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; if (mi >= 0) S.reportDate = new Date(y, mi, +m[1]); } }
  let n = 0;
  for (const r of rows.slice(hi + 1)) {
    const acc = (r[iAcc] || '').trim(); if (!/^\d+$/.test(acc)) continue;
    const code = W.codeOf({ 'Asset type': r[iType], 'Asset code': r[iCode] });
    const a = S.holdings[acc] || (S.holdings[acc] = { cur: {}, name: r[iName], adviser: r[iAdv] });
    a.cur[code] = (a.cur[code] || 0) + num(r[iVal]); n++;
  }
  return n;
}

// ---------- workbook ----------
const fmtDate = d => { if (!(d instanceof Date)) return d ? String(d) : ''; const x = new Date(d.getTime() + 12 * 3600e3); return x.getUTCDate() + ' ' + W.MONTHS[x.getUTCMonth()] + ' ' + x.getUTCFullYear(); };
function loadWorkbook(buf) {
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets['ROA Client Details']; if (!ws) throw new Error('No "ROA Client Details" sheet in that workbook.');
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
  const reb = {}; const rs = wb.Sheets['Rebalance list'];
  if (rs) {
    const all = XLSX.utils.sheet_to_json(rs, { header: 1, defval: null, raw: true });
    const hi = all.findIndex(r => r && r.includes('Account number')); const H = all[hi];
    all.slice(hi + 1).forEach(r => { const acc = r[H.indexOf('Account number')]; if (!acc) return; const g = k => { const v = r[H.indexOf(k)]; return v == null ? '' : String(v).trim(); };
      reb[String(acc).trim()] = { rec: g('Recommended model'), ov: g('Adviser override model'), excl: g('Exclude from rebalance (reason)'), note: g('Adviser note'), age: g('Age') }; });
  }
  S.hasReb = !!rs;
  // Holdings and report date can come from the workbook itself (one-file mode)
  if (S.wbHoldings) { S.holdings = {}; S.reportDate = null; }
  S.wbHoldings = false;
  const hs = wb.Sheets['Current Holdings'];
  if (hs && !Object.keys(S.holdings).length) {
    const hr = XLSX.utils.sheet_to_json(hs, { defval: null, raw: true });
    hr.forEach(r => { const acc = String(r['Account number'] == null ? '' : r['Account number']).trim(); if (!/^\d+$/.test(acc)) return;
      const code = W.codeOf({ 'Asset type': r['Asset type'], 'Asset code': r['Asset code'] });
      const a = S.holdings[acc] || (S.holdings[acc] = { cur: {}, name: r['Account name'], adviser: '' });
      a.cur[code] = (a.cur[code] || 0) + num(r['Value']); });
    S.wbHoldings = Object.keys(S.holdings).length > 0;
    const sm = wb.Sheets['Summary']; let txt = '';
    if (sm) XLSX.utils.sheet_to_json(sm, { header: 1, defval: '' }).forEach(r => txt += ' ' + r.join(' '));
    const m = txt.match(/as at (\d{1,2})\/(\d{1,2})\/(\d{4})/i); if (m) S.reportDate = new Date(+m[3], +m[2] - 1, +m[1]);
  }
  S.clients = rows.filter(r => r['Account number']).map(r => {
    const g = k => (r[k] == null ? '' : r[k]);
    const middle = String(g('Middle name(s)')).trim(); const m = middle && !/^[-–.]+$/.test(middle) ? middle : '';
    const first = String(g('First name')).trim(), last = String(g('Last name')).trim();
    const full = (first || last) ? [first, m, last].filter(Boolean).join(' ') : String(g('Platform account name'));
    const dobTxt = String(g('DOB to use (text)') || '') || fmtDate(r['DOB to use']);
    const model0 = String(g('Current model (from holdings)'));
    const rb = reb[String(r['Account number']).trim()] || {};
    let target = (rb.ov || rb.rec || '').replace(/^W23\s+/, '').trim();
    if (!rs) target = model0 === 'Balanced' ? 'Balanced – under 60' : model0;
    const excl = rb.excl || (/^Excluded/i.test(target) ? 'Excluded' : '');
    return {
      account: String(r['Account number']).trim(), platformName: String(g('Platform account name')), accountType: String(g('Account type')), adviser: String(g('Adviser')),
      wbBalance: num(g('Account balance ($)')), model: !excl && W.MODELS[target] ? target : '', model0, currentProfile: model0, excl, rbNote: rb.note || '', target, first, last, fullName: full, firstName: first || String(g('Platform account name')).split(' ')[0],
      dob: dobTxt, dobCheck: String(g('DOB check vs fact find')), soaDate: String(g('SOA date (text)')), soaProfile: String(g('SOA risk profile')), soaNote: String(g('SOA note')),
      include: !excl && !!W.MODELS[target],
    };
  });
}

// ---------- settings ----------
function settings() {
  const v = id => $('#' + id).value, d = new Date(v('roaDate') + 'T12:00:00');
  const ar = {}; document.querySelectorAll('.ar').forEach(i => { ar[i.dataset.adv] = i.value.trim(); });
  return { minTrade: num(v('minTrade')), brokeragePct: num(v('brPct')), brokerageMin: num(v('brMin')), ongoingPct: num(v('ongPct')), ongoingCap: num(v('ongCap')),
    roaDateText: W.longDate(d), balanceDateText: S.reportDate ? W.longDate(S.reportDate) : '{{BALANCE_DATE}}', ar, showNotes: $('#notes').checked, draft: $('#draft').checked };
}

// ---------- analysis ----------
function analyse() {
  const s = settings(); const nameCount = {};
  S.clients.forEach(c => { const k = (c.first + ' ' + c.last).toLowerCase(); nameCount[k] = (nameCount[k] || 0) + 1; });
  // Same person with 2+ accounts (e.g. super + TTR pension) is treated as one combined balance by hand
  const personCount = {}; const pk = c => (c.first + '|' + c.last + '|' + c.dob).toLowerCase();
  S.clients.forEach(c => { if (c.model) personCount[pk(c)] = (personCount[pk(c)] || 0) + 1; });
  S.clients.forEach(c => {
    const h = S.holdings[c.account]; c.flags = []; c.blockers = [];
    c.calc = null;
    if (c.model && personCount[pk(c)] > 1) { c.blockers.push('Manual ROA'); c.exclReason = 'Manual ROA: client has ' + personCount[pk(c)] + ' BT accounts (super + TTR) – treat as one combined balance'; }
    if (!c.model) c.blockers.push(c.excl ? 'Excluded' : (c.target || c.model0 || 'No model'));
    if (c.excl) c.exclReason = c.excl;
    if (!h) c.blockers.push('Not in holdings CSV');
    if (c.model && h) {
      c.calc = W.computeAccount(h.cur, c.model, s);
      if (c.wbBalance && Math.abs(c.calc.bal - c.wbBalance) / c.wbBalance > 0.02) c.flags.push('Balance differs from client workbook (' + W.money(c.wbBalance) + ')');
      if (c.calc.unknown.length) c.flags.push('Unrecognised holding: ' + c.calc.unknown.join(', '));
      if (c.calc.cashNeg) c.flags.push('Cash would go negative');
      if (c.calc.trades === 0) c.flags.push('No trades needed');
    }
    if (!c.soaDate) c.flags.push('SOA date missing');
    if (c.soaProfile && c.model && c.soaProfile.toLowerCase() !== W.profileOf(c.model).toLowerCase()) c.flags.push('SOA profile is ' + c.soaProfile);
    if (c.soaNote) c.flags.push('SOA: ' + c.soaNote);
    if (c.rbNote) c.flags.push('Adviser note: ' + c.rbNote);
    if (!c.dob) c.flags.push('DOB missing'); else if (/MISMATCH|Not in/i.test(c.dobCheck)) c.flags.push('DOB unconfirmed');
    if (!s.ar[c.adviser]) c.flags.push('No AR number for ' + c.adviser);
    if (nameCount[(c.first + ' ' + c.last).toLowerCase()] > 1) c.dup = true;
  });
}

// ---------- UI ----------
function render() {
  analyse();
  const tb = $('#rows'); tb.innerHTML = '';
  const q = S.filter.toLowerCase();
  const list = S.clients.filter(c => !q || (c.fullName + ' ' + c.account + ' ' + c.adviser + ' ' + c.model).toLowerCase().includes(q));
  list.forEach(c => {
    const tr = el('tr', { class: c.blockers.length ? 'blocked' : '' },
      el('td', {}, el('input', { type: 'checkbox', ...(c.include && !c.blockers.length ? { checked: '' } : {}), ...(c.blockers.length ? { disabled: '' } : {}), onchange: e => { c.include = e.target.checked; count(); } })),
      el('td', {}, el('b', {}, c.fullName), el('div', { class: 'sub' }, c.account + (c.platformName && c.platformName !== c.fullName ? ' · ' + c.platformName : ''))),
      el('td', {}, c.adviser.split(' ')[0]),
      el('td', { class: 'r' }, c.calc ? W.money(c.calc.bal) : '–'),
      el('td', {}, c.blockers.length ? el('span', { class: 'tag bad' }, c.blockers[0]) : el('select', { onchange: e => { c.model = e.target.value; render(); } }, Object.keys(W.MODELS).map(m => el('option', { value: m, ...(m === c.model ? { selected: '' } : {}) }, m)))),
      el('td', { class: 'r' }, c.calc ? c.calc.trades : '–'),
      el('td', { class: 'r' }, c.calc ? W.money(c.calc.total) : '–'),
      el('td', {}, c.soaDate || el('span', { class: 'tag warn' }, 'missing')),
      el('td', { class: 'fl' }, c.blockers.length ? el('span', { class: 'sub' }, c.exclReason || c.blockers.join('; ')) : c.flags.map(f => el('div', { class: 'tag ' + (/missing|negative|Unrecognised|differs from client/.test(f) ? 'warn' : 'info') }, f))));
    tb.append(tr);
  });
  count();
}
function count() {
  const n = S.clients.filter(c => c.include && !c.blockers.length).length;
  $('#count').textContent = S.clients.length ? `${n} of ${S.clients.length} accounts selected` : '';
  $('#go').disabled = !n;
}
function ready() { return S.clients.length && Object.keys(S.holdings).length; }
function maybeRender() { if (S.clients.length) { $('#review').hidden = false; render(); } }

async function readFile(f) { return f.arrayBuffer(); }
async function onHoldings(files) {
  const msg = $('#hmsg'); S.holdings = {}; S.reportDate = null; let tot = 0;
  try { for (const f of files) tot += loadHoldingsText(await f.text(), f.name); msg.textContent = `${files.length} file(s), ${Object.keys(S.holdings).length} accounts${S.reportDate ? ', as at ' + W.longDate(S.reportDate) : ''}`; msg.className = 'ok'; }
  catch (e) { msg.textContent = e.message; msg.className = 'err'; }
  maybeRender();
}
async function onWorkbook(f) {
  const msg = $('#cmsg');
  try { loadWorkbook(await readFile(f)); msg.textContent = `${S.clients.length} accounts in ${f.name}` + (S.wbHoldings ? ` · holdings for ${Object.keys(S.holdings).length} accounts read from the workbook${S.reportDate ? ' (as at ' + W.longDate(S.reportDate) + ')' : ''}` : ''); msg.className = 'ok'; }
  catch (e) { msg.textContent = e.message; msg.className = 'err'; }
  maybeRender();
}

function fileName(c, used) {
  let base = (c.first + ' ' + c.last).trim() || c.fullName; base = base.replace(/[\\/:*?"<>|]/g, '').trim();
  let name = base + ' ROA.docx';
  if (c.dup || used.has(name.toLowerCase())) name = base + ' ROA (' + c.account + ').docx';
  used.add(name.toLowerCase()); return name;
}
async function generate() {
  const s = settings(); analyse();
  const sel = S.clients.filter(c => c.include && !c.blockers.length);
  const zip = new JSZip(), used = new Set(), sum = [['File', 'Client', 'Account', 'Adviser', 'Model', 'Balance', 'Trades', 'Brokerage', 'Spread', 'Total costs', 'SOA date', 'Flags']];
  const bar = $('#bar'), st = $('#status'); $('#go').disabled = true; bar.hidden = false;
  const logo = Uint8Array.from(atob(window.LOGO_B64), ch => ch.charCodeAt(0));
  let i = 0, errors = 0;
  for (const c of sel) {
    try {
      const calc = W.computeAccount(S.holdings[c.account].cur, c.model, s);
      const data = W.buildDocData({ model: c.model, fullName: c.fullName, firstName: c.firstName, currentProfile: c.currentProfile, accountType: c.accountType, account: c.account, adviser: c.adviser, ar: s.ar[c.adviser], soaDate: c.soaDate, dob: c.dob }, calc, s);
      const doc = window.buildDoc(data, logo, window.docx);
      const blob = await window.docx.Packer.toBlob(doc);
      const fn = fileName(c, used); zip.file(fn, blob);
      sum.push([fn, c.fullName, c.account, c.adviser, c.model, calc.bal.toFixed(2), calc.trades, calc.brokerage.toFixed(2), calc.spread.toFixed(2), calc.total.toFixed(2), c.soaDate, c.flags.join('; ')]);
    } catch (e) { errors++; sum.push(['ERROR', c.fullName, c.account, c.adviser, c.model, '', '', '', '', '', '', String(e.message || e)]); }
    i++; bar.firstElementChild.style.width = (100 * i / sel.length) + '%'; st.textContent = `Building ${i} of ${sel.length}…`;
    if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
  }
  zip.file('_Batch summary.csv', sum.map(r => r.map(x => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\r\n'));
  st.textContent = 'Zipping…';
  const out = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const a = el('a', { href: URL.createObjectURL(out), download: 'Wealth 23 ROAs ' + $('#roaDate').value + '.zip' }); document.body.append(a); a.click(); a.remove();
  st.textContent = `Done: ${sel.length - errors} ROAs in the zip saved to your Downloads folder${errors ? ' (' + errors + ' errors, see the summary file)' : ''}.`;
  $('#go').disabled = false;
}

function init() {
  const today = new Date(); $('#roaDate').value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  const D = W.DEFAULTS; $('#minTrade').value = D.minTrade; $('#brPct').value = D.brokeragePct; $('#brMin').value = D.brokerageMin; $('#ongPct').value = D.ongoingPct; $('#ongCap').value = D.ongoingCap;
  const arBox = $('#arBox'); Object.entries(D.ar).forEach(([adv, no]) => arBox.append(el('label', {}, adv + ' AR no.', el('input', { class: 'ar', 'data-adv': adv, value: no, onchange: maybeRender }))));
  $('#hfile').addEventListener('change', e => onHoldings([...e.target.files]));
  $('#cfile').addEventListener('change', e => e.target.files[0] && onWorkbook(e.target.files[0]));
  ['dragover', 'drop'].forEach(ev => document.querySelectorAll('.drop').forEach(z => z.addEventListener(ev, e => {
    e.preventDefault(); if (ev === 'drop') { const inp = z.querySelector('input'); inp.files = e.dataTransfer.files; inp.dispatchEvent(new Event('change')); } })));
  document.querySelectorAll('#settings input').forEach(i => i.addEventListener('change', maybeRender));
  $('#q').addEventListener('input', e => { S.filter = e.target.value; render(); });
  $('#all').addEventListener('change', e => { S.clients.forEach(c => { if (!c.blockers.length) c.include = e.target.checked; }); render(); });
  $('#go').addEventListener('click', generate);
}
document.addEventListener('DOMContentLoaded', init);
window.__S = S;
})();
