(function (root) {
// ---------- Reference data (edit here when the IC changes the models) ----------
const HOLDINGS = {
  OPS1827AU: { name: 'Tacking Point Equity Income Fund', fee: .0097, yld: .067, bank: .09, growth: 1, kind: 'fund', spread: .0025 },
  AYLD: { name: 'Global X S&P/ASX 200 Covered Call ETF', fee: .006, yld: .065, bank: .27, growth: 1, kind: 'etf' },
  QOZ:  { name: 'Betashares Australia 200 Fundamental Value ETF', fee: .004, yld: .045, bank: .30, growth: 1, kind: 'etf' },
  EX20: { name: 'Betashares Australian Ex-20 Portfolio Diversifier ETF', fee: .0025, yld: .036, bank: .04, growth: 1, kind: 'etf' },
  VAP:  { name: 'Vanguard Australian Property Securities ETF', fee: .0023, yld: .04, bank: 0, growth: 1, kind: 'etf' },
  IVV:  { name: 'iShares S&P 500 ETF', fee: .0004, yld: .012, bank: 0, growth: 1, kind: 'etf' },
  IHVV: { name: 'iShares S&P 500 (AUD Hedged) ETF', fee: .001, yld: .012, bank: 0, growth: 1, kind: 'etf' },
  HYGG: { name: 'Hyperion Global Growth Companies (Managed Fund)', fee: .007, yld: .005, bank: 0, growth: 1, kind: 'fund' },
  VEQ:  { name: 'Vanguard FTSE Europe Shares ETF', fee: .0035, yld: .03, bank: 0, growth: 1, kind: 'etf' },
  IXJ:  { name: 'iShares Global Healthcare ETF', fee: .0041, yld: .015, bank: 0, growth: 1, kind: 'etf' },
  NDQ:  { name: 'Betashares NASDAQ 100 ETF', fee: .0038, yld: .005, bank: 0, growth: 1, kind: 'etf' },
  GOVT: { name: 'SPDR S&P/ASX iBoxx Australian Government Bond ETF', fee: .001, yld: .045, bank: 0, growth: 0, kind: 'etf' },
  IHCB: { name: 'iShares Core Global Corporate Bond (AUD Hedged) ETF', fee: .0026, yld: .049, bank: 0, growth: 0, kind: 'etf' },
  SUBD: { name: 'VanEck Australian Subordinated Debt ETF', fee: .0029, yld: .06, bank: 1, growth: 0, kind: 'etf' },
  IHHY: { name: 'iShares Global High Yield Bond (AUD Hedged) ETF', fee: .0056, yld: .08, bank: 0, growth: 0, kind: 'etf' },
  ISEC: { name: 'iShares Enhanced Cash ETF', fee: .0012, yld: .047, bank: 0, growth: 0, kind: 'etf' },
  CASH: { name: 'Platform cash', fee: 0, yld: .038, bank: 0, growth: 0, kind: 'cash' },
  FANG: { name: 'Global X FANG+ ETF', fee: .0035, yld: .001, bank: 0, growth: 1, kind: 'etf' },
  SEMI: { name: 'Global X Semiconductor ETF', fee: .0045, yld: .003, bank: 0, growth: 1, kind: 'etf' },
  ETHI: { name: 'Betashares Global Sustainability Leaders ETF', fee: .0049, yld: .015, bank: 0, growth: 1, kind: 'etf' },
  MVB:  { name: 'VanEck Australian Banks ETF', fee: .0028, yld: .045, bank: .95, growth: 1, kind: 'etf' },
  VHY:  { name: 'Vanguard Australian Shares High Yield ETF', fee: .0025, yld: .055, bank: .34, growth: 1, kind: 'etf' },
};
const ORDER = Object.keys(HOLDINGS);
// New model weights (percent), BT Panorama, IC 4 Nov 2026
const MODELS = {
  'Balanced – under 60':    { OPS1827AU: 5, AYLD: 5, QOZ: 10, EX20: 5, VAP: 4, IVV: 6,  IHVV: 8, HYGG: 6,  VEQ: 7,  IXJ: 4, NDQ: 0, GOVT: 11, IHCB: 4, SUBD: 5, IHHY: 10, ISEC: 8, CASH: 2 },
  'Balanced – 60 and over': { OPS1827AU: 0, AYLD: 10, QOZ: 10, EX20: 5, VAP: 4, IVV: 6,  IHVV: 8, HYGG: 6,  VEQ: 7,  IXJ: 4, NDQ: 0, GOVT: 11, IHCB: 4, SUBD: 5, IHHY: 10, ISEC: 8, CASH: 2 },
  'Growth':      { OPS1827AU: 10, QOZ: 10, EX20: 7, VAP: 5, IVV: 13, IHVV: 9, HYGG: 8,  VEQ: 11, IXJ: 5, NDQ: 0, GOVT: 5,  IHCB: 2, SUBD: 4, IHHY: 6,  ISEC: 3, CASH: 2 },
  'High Growth': { OPS1827AU: 10, QOZ: 10, EX20: 8, VAP: 5, IVV: 26, IHVV: 0, HYGG: 10, VEQ: 14, IXJ: 7, NDQ: 5, GOVT: 0,  IHCB: 0, SUBD: 0, IHHY: 0,  ISEC: 3, CASH: 2 },
};
const profileOf = m => (/^Balanced/.test(m) ? 'Balanced' : m);
const modelLabel = m => m.replace(/ – (.*)$/, ' ($1)');
// Weights of the models before the rebalance (used for the "what changes" wording)
const OLD_MODELS = {
  'Balanced':    { VAP: 4, IVV: 18, HYGG: 10, IXJ: 4, NDQ: 4, IHHY: 20, SUBD: 18, CASH: 2, FANG: 4, SEMI: 4, ETHI: 4, MVB: 4, VHY: 4 },
  'Growth':      { VAP: 5, IVV: 25, HYGG: 10, IXJ: 5, NDQ: 5, IHHY: 12, SUBD: 12, CASH: 2, FANG: 5, SEMI: 5, ETHI: 5, MVB: 4, VHY: 5 },
  'High Growth': { VAP: 5, IVV: 30, HYGG: 10, IXJ: 10, NDQ: 10, IHHY: 0, SUBD: 0, CASH: 2, FANG: 5, SEMI: 5, ETHI: 10, MVB: 8, VHY: 5 },
};
const GROWTH_PCT = { 'Balanced': 60, 'Growth': 78, 'High Growth': 95 };
const PROFILE_TEXT = {
  'Balanced': 'Using a slightly higher exposure to growth assets than income assets, this portfolio is expected to have lower short-term fluctuations in value than the other growth-based investment portfolios. Its aim is to produce capital growth in a medium- to long-term time frame. It has a "balanced" exposure to shares, property and fixed income assets.',
  'Growth': 'A growth-oriented portfolio that is best suited to long-term investors. A small income exposure should slightly reduce the shorter-term fluctuations of the portfolio’s value. It is best suited to a long-term investor who can accept some investment risk over the long run. The portfolio has a high exposure to shares and property to provide long-term investment growth.',
  'High Growth': 'A growth-based portfolio with minimal exposure to income assets. It has a strong emphasis on maximising capital growth over the long term. Investors should expect high short-term fluctuations in values and a higher chance of capital loss. However, they are prepared to accept this to achieve their long-term investment objective.',
};
// Product disclosure statements (supplied by Wealth 23, 5 Nov 2026). Codes not listed fall back to "Current PDS".
const PDS = {
  PLATFORM: { date: '20 September 2026', url: 'https://www.bt.com.au/content/dam/public/btfg-bt/documents/legacy/download/panorama/documents/Panorama-Super-PDS.pdf' },
  OPS1827AU: { date: '7 September 2026', url: 'https://tpam.capital/downloads/NzU2fDA.5155f73ff86610174485' },
  QOZ: { date: '18 September 2026', url: 'https://www.betashares.com.au/files/collateral/pds/QOZ-pds.pdf' },
  EX20: { date: '18 September 2026', url: 'https://www.betashares.com.au/files/collateral/pds/QOZ-pds.pdf' },
  IHVV: { date: '5 November 2026', url: 'https://www.blackrock.com/au/literature/product-disclosure-statement/ishares-international-equity-etfs-product-disclosure-statement-en-au.pdf' },
  VEQ: { date: '1 September 2026', url: 'https://fund-docs.vanguard.com/AU-ETFPDS-Vanguard_FTSE_Europe_Shares_ETF-VEQ.pdf' },
  GOVT: { date: '13 February 2026', url: 'https://www.ssga.com/au/en_gb/intermediary/library-content/products/fund-docs/etfs/apac/au/pds/product-disclosure-statement-au-en-bond.pdf' },
  IHCB: { date: '24 September 2026', url: 'https://www.blackrock.com/au/literature/product-disclosure-statement/ishares-international-fixed-income-etfs-product-disclosure-statement-en-au.pdf' },
  ISEC: { date: '24 September 2026', url: 'https://www.blackrock.com/au/literature/product-disclosure-statement/ishares-australian-fixed-income-and-cash-etfs-product-disclosure-statement-en-au.pdf' },
};
const DEFAULTS = { minTrade: 500, brokeragePct: 0.11, brokerageMin: 12.5, ongoingPct: 1.65, ongoingCap: 9000,
  ar: { 'Clifford Samson': '465553', 'Sabrina Siew Siew Teo': '1314740' } };

// ---------- helpers ----------
const money = v => (v < 0 ? '-' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-AU');
const money2 = v => '$' + Math.abs(v).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v, d = 1) => (v * 100).toFixed(d) + '%';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const longDate = d => d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();

function codeOf(row) {
  if (/^cash$/i.test(row['Asset type'] || '')) return 'CASH';
  const c = (row['Asset code'] || '').trim();
  if (c === 'WHT8435AU') return 'HYGG';
  return c;
}

// Compute the trades for one account. cur = {CODE: dollars}
function computeAccount(cur, model, opt) {
  const o = Object.assign({}, DEFAULTS, opt || {});
  const w = MODELS[model];
  const bal = Object.values(cur).reduce((a, b) => a + b, 0);
  const unknown = Object.keys(cur).filter(k => !HOLDINGS[k]);
  // first pass: non-cash targets, apply minimum trade
  const target = {}; let nonCash = 0;
  for (const k of ORDER) {
    if (k === 'CASH') continue;
    const c = cur[k] || 0, n = bal * (w[k] || 0) / 100;
    if (c === 0 && n === 0) continue;
    const small = c > 0 && n > 0 && Math.abs(n - c) < o.minTrade;
    target[k] = small ? c : n; nonCash += target[k];
  }
  target.CASH = bal - nonCash;
  const rows = []; let brokerage = 0, spread = 0, trades = 0, nListed = 0;
  const totals = { cur: 0, nw: 0 };
  const m = { gc: 0, gn: 0, yc: 0, yn: 0, bc: 0, bn: 0, fc: 0, fn: 0 };
  for (const k of ORDER) {
    const c = cur[k] || 0; const n = target[k] || 0;
    if (c === 0 && n === 0) continue;
    const d = n - c; const h = HOLDINGS[k];
    let act;
    if (k === 'CASH') act = 'Adjust';
    else if (n === 0) act = 'Sell all';
    else if (c === 0) act = 'Buy';
    else if (d === 0 || (Math.abs(d) < o.minTrade)) act = 'Hold';
    else act = d > 0 ? 'Buy' : 'Sell';
    if (k !== 'CASH' && act !== 'Hold') {
      trades++;
      if (h.kind === 'etf') { nListed++; brokerage += Math.max(o.brokerageMin, Math.abs(d) * o.brokeragePct / 100); }
      if (h.spread && d > 0) spread += d * h.spread;
    }
    rows.push({ code: k, name: h.name, act, cur: c, nw: n, d });
    totals.cur += c; totals.nw += n;
    m.gc += c * h.growth; m.gn += n * h.growth; m.yc += c * h.yld; m.yn += n * h.yld; m.bc += c * h.bank; m.bn += n * h.bank; m.fc += c * h.fee; m.fn += n * h.fee;
  }
  return { bal, rows, trades, nListed, brokerage, spread, total: brokerage + spread, unknown,
    growthC: bal ? m.gc / bal : 0, growthN: bal ? m.gn / bal : 0, yieldC: bal ? m.yc / bal : 0, yieldN: bal ? m.yn / bal : 0,
    bankC: bal ? m.bc / bal : 0, bankN: bal ? m.bn / bal : 0, feeC: bal ? m.fc / bal : 0, feeN: bal ? m.fn / bal : 0, feeCD: m.fc, feeND: m.fn,
    cashNeg: target.CASH < -1, tpBuy: Math.max(0, (target.OPS1827AU || 0) - (cur.OPS1827AU || 0)) };
}

function modelChangeText(model) {
  const p = profileOf(model), o = OLD_MODELS[p], n = MODELS[model];
  const g = (m, k) => m[k] || 0;
  if (p === 'High Growth') {
    return 'In the High Growth model the main changes are less in US shares (the S&P 500 holding goes from 30% to 26% and the NASDAQ 100 from 10% to 5%), more in Europe (14%) and Australian shares (Tacking Point 10%, QOZ 10%, EX20 8%), and a 3% enhanced cash holding. About 2% stays in cash.';
  }
  let t = `In the ${modelLabel(model)} model, high-yield bonds are cut from ${g(o,'IHHY')}% to ${g(n,'IHHY')}% and subordinated debt from ${g(o,'SUBD')}% to ${g(n,'SUBD')}%. We add ${g(n,'GOVT')}% government bonds, ${g(n,'IHCB')}% corporate bonds and ${g(n,'ISEC')}% enhanced cash in their place, and about ${g(n,'CASH')}% stays in cash.`;
  if (p === 'Balanced') t += model === 'Balanced – under 60'
    ? ' The Balanced model has two versions based on age. The under-60 version holds 5% in the Tacking Point Equity Income Fund and 5% in the Global X S&P/ASX 200 Covered Call ETF (AYLD).'
    : ' The Balanced model has two versions based on age. The 60-and-over version holds no Tacking Point Equity Income Fund and instead holds 10% in the Global X S&P/ASX 200 Covered Call ETF (AYLD), which aims to provide income.';
  return t;
}

function riskBullet(model) {
  const n = MODELS[model];
  if (profileOf(model) === 'High Growth') return '**Little protection in falling markets.** The High Growth model holds only about 5% in defensive assets (cash and enhanced cash), so it can be expected to fall by close to as much as share markets do.';
  return `**Credit risk.** Your model keeps some investments in corporate credit (high-yield bonds at ${n.IHHY}% and subordinated debt at ${n.SUBD}%). These remain exposed to corporate credit losses, which can be larger when markets are stressed.`;
}
function changeBullets(model) {
  const p = profileOf(model), b = [];
  if (p !== 'High Growth') b.push('**Safer income in the defensive part of the portfolio.** Less exposure to high-yield and bank subordinated debt, and more government bonds, corporate bonds and enhanced cash.');
  const add = model === 'Balanced – under 60' ? 'The Tacking Point Equity Income Fund (5%), the Global X S&P/ASX 200 Covered Call ETF (AYLD, 5%) and the BetaShares Australia 200 Fundamental Value ETF (QOZ) are added'
    : model === 'Balanced – 60 and over' ? 'The Global X S&P/ASX 200 Covered Call ETF (AYLD, 10%) and the BetaShares Australia 200 Fundamental Value ETF (QOZ) are added'
    : 'The Tacking Point Equity Income Fund and the BetaShares Australia 200 Fundamental Value ETF (QOZ) are added';
  b.push(`**More yield and value in the growth part.** ${add}, with the BetaShares Australian Ex-20 ETF (EX20) added to diversify Australian shares.`);
  b.push(p === 'High Growth' ? '**Lower bank exposure.** The Australian banks and high-yield share ETFs are sold.' : '**Lower bank exposure.** Part of the subordinated debt holding moves into corporate bonds, and the Australian banks and high-yield share ETFs are sold.');
  b.push(p === 'High Growth' ? '**Less overlap and US technology concentration.** The FANG+, Semiconductor and Global Sustainability Leaders ETFs are sold, and the NASDAQ 100 holding is reduced.' : '**Less overlap and US technology concentration.** The FANG+, Semiconductor, Global Sustainability Leaders and Australian Banks ETFs are sold, and the NASDAQ 100 holding is removed.');
  return b;
}
function newInvestBullet(model) {
  const w = MODELS[model], parts = [];
  if (w.OPS1827AU) parts.push('The Tacking Point Equity Income Fund is an actively managed fund (formerly Vertium) with higher fees than the ETFs in the models and a buy/sell spread.');
  if (w.AYLD) parts.push('The Global X S&P/ASX 200 Covered Call ETF (AYLD) earns extra income by selling call options over Australian shares. This can limit your gains when share markets rise strongly, and it still falls with the market when markets fall.');
  parts.push('The rating for several new ETFs is "not rated" by Morningstar.');
  return '**Newly added investments.** ' + parts.join(' ');
}

// Build the data object for the document builder
function buildDocData(a, calc, s) {
  // a: account info; calc: computeAccount result; s: settings
  const model = a.model, fullName = a.fullName, prof = profileOf(model), curProf = OLD_MODELS[a.currentProfile] ? a.currentProfile : prof;
  const ongoing = Math.min(calc.bal * s.ongoingPct / 100, s.ongoingCap);
  const hy = { OPS1827AU: 1 };
  const listedTrades = calc.nListed;
  const v = {
    CLIENT_FULL_NAME: fullName, CLIENT_FIRST_NAME: a.firstName, ROA_DATE: s.roaDateText,
    PLATFORM: 'BT Panorama', ACCOUNT_TYPE: /pension/i.test(a.accountType) ? 'Super (pension)' : 'Super', PRODUCT_NAME: /pension/i.test(a.accountType) ? 'Super (pension)' : 'Super',
    ACCOUNT_NUMBER: a.account, ADVISER_NAME: a.adviser, AR_NUMBER: a.ar || '{{AR_NUMBER}}', SOA_DATE: a.soaDate || '{{SOA_DATE}}',
    DATE_OF_BIRTH: a.dob || '{{DATE_OF_BIRTH}}', ACCOUNT_BALANCE: money(calc.bal), BALANCE_DATE: s.balanceDateText,
    CURRENT_MODEL: 'Wealth 23 ' + curProf + ' (before the rebalance)', RISK_PROFILE: prof, MODEL_NAME: modelLabel(model),
    RISK_PROFILE_DESCRIPTION: PROFILE_TEXT[prof], MODEL_GROWTH_PCT: GROWTH_PCT[prof] + '%', MODEL_DEFENSIVE_PCT: (100 - GROWTH_PCT[prof]) + '%',
    MODEL_SPECIFIC_REASONS: modelChangeText(model),
    CURRENT_GROWTH_PCT: pct(calc.growthC), NEW_GROWTH_PCT: pct(calc.growthN), CURRENT_DEFENSIVE_PCT: pct(1 - calc.growthC), NEW_DEFENSIVE_PCT: pct(1 - calc.growthN),
    CURRENT_YIELD: pct(calc.yieldC), NEW_YIELD: pct(calc.yieldN), CURRENT_BANK: pct(calc.bankC), NEW_BANK: pct(calc.bankN),
    NUMBER_OF_TRADES: String(calc.trades),
    BROKERAGE_TOTAL: money(calc.brokerage), BROKERAGE_BASIS: `${s.brokeragePct}% of each listed trade (minimum ${money2(s.brokerageMin)}); ${listedTrades} listed trades`,
    SPREAD_TOTAL: money(calc.spread), SPREAD_BASIS: calc.tpBuy > 0 ? `0.25% on the ${money(calc.tpBuy)} Tacking Point purchase` : 'No Tacking Point purchase',
    TRANSACTION_TOTAL: money(calc.total), TRANSACTION_PCT: pct(calc.bal ? calc.total / calc.bal : 0, 2),
    CURRENT_FEE_PCT: (calc.feeC * 100).toFixed(2) + '%', NEW_FEE_PCT: (calc.feeN * 100).toFixed(2) + '%', CURRENT_FEE_DOLLARS: money(calc.feeCD), NEW_FEE_DOLLARS: money(calc.feeND),
    CONFIRM_NO_UPFRONT_FEE: '', ONGOING_FEE_PCT: `${s.ongoingPct}% (${(s.ongoingPct / 1.1).toFixed(1)}% plus GST, capped at ${money(s.ongoingCap)})`, ONGOING_FEE_ESTIMATE: money(ongoing),
  };
  const rows = calc.rows.map(r => [`${r.name} (${r.code})`, r.act, money(r.cur), pct(r.cur / calc.bal), money(r.nw), pct(r.nw / calc.bal), r.act === 'Hold' ? '–' : (r.d > 0 ? '+' : '') + money(r.d)]);
  const newCodes = calc.rows.filter(r => r.cur === 0 && r.nw > 0 && r.code !== 'CASH').map(r => r.code);
  const pf = k => (PDS[k] ? [PDS[k].date, PDS[k].url] : ['Current PDS', 'On the issuer’s website, or from us on request']);
  const pds = [['BT Panorama Super (PDS and guide)', ...pf('PLATFORM')]].concat(
    newCodes.map(c => [`${HOLDINGS[c].name} (${c})`, ...pf(c)]));
  const smallHolds = calc.rows.filter(r => r.act === 'Hold').map(r => r.name);
  return {
    v, rows, totals: [money(calc.bal), money(calc.bal)], pds,
    cover_note: s.draft ? 'DRAFT for review – not approved for issue to the client. The italic notes under each section are for compliance and will be removed from client copies.' : '',
    hideNotes: !s.showNotes,
    threshold_note: `Trades under ${money(s.minTrade)} are not made${smallHolds.length ? ' (' + smallHolds.length + ' holding' + (smallHolds.length > 1 ? 's' : '') + ' stay' + (smallHolds.length > 1 ? '' : 's') + ' as they are)' : ''}, so cash and any holdings left as they are differ slightly from the model weights.`,
    s4_bullets: changeBullets(model), risk_bullet: riskBullet(model), new_invest_bullet: newInvestBullet(model),
    cost_note: `Costs shown are brokerage on listed securities (${s.brokeragePct}% of the trade, minimum ${money2(s.brokerageMin)}, under the BT Panorama Super PDS dated ${PDS.PLATFORM.date}) ${MODELS[model].OPS1827AU ? 'and the 0.25% spread on buying the Tacking Point Equity Income Fund' : 'only, because your model does not buy the Tacking Point Equity Income Fund'}. Panorama charges no buy/sell spread of its own and no fee on managed fund trades. The normal market bid/ask spread on ETFs and any spread charged by other managed funds are not included. Actual costs depend on prices and spreads when the trades are made.`,
  };
}

const api = { PDS, profileOf, modelLabel, HOLDINGS, ORDER, MODELS, OLD_MODELS, GROWTH_PCT, PROFILE_TEXT, DEFAULTS, money, money2, pct, longDate, MONTHS, codeOf, computeAccount, buildDocData };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.W23 = api;
})(typeof window !== 'undefined' ? window : globalThis);
