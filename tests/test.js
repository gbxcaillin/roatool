// End-to-end test. Usage: ROA_WORKBOOK=/path/to/workbook.xlsx npm test
// Client data is never committed; point ROA_WORKBOOK at a local copy.
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const wb = process.env.ROA_WORKBOOK; if (!wb) { console.error('Set ROA_WORKBOOK to the ROA workbook path'); process.exit(1); }
  const out = process.env.ROA_OUT || path.resolve(__dirname, '../out.zip');
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await p.setInputFiles('#cfile', wb);
  await p.waitForTimeout(1500);
  console.log('cmsg:', await p.textContent('#cmsg'), '|', await p.textContent('#count'));
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 180000 }), p.click('#go')]);
  await dl.saveAs(out); console.log('download', dl.suggestedFilename(), await p.textContent('#status'));
  console.log(errs.join('\n') || 'no errors'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
