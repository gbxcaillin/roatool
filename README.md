# Wealth 23 ROA tool

Drop in one workbook, get one Word Record of Advice (ROA) per client in a zip. It runs entirely in the browser: no client data is uploaded or stored anywhere.

> The live page is served from `index.html` at the repo root (a build of `src/`). After changing anything in `src/`, run `npm run build && cp dist/index.html index.html` and commit it. If Pages is switched to Source: GitHub Actions, the workflow builds it automatically and `index.html` can be deleted.

## Using it
1. Open the published page (GitHub Pages) or `dist/index.html` after `npm run build`.
2. Drop in the ROA workbook (`W23_ROA_Client_Details_Rebalance_SOA.xlsx`). It needs the sheets **ROA Client Details**, **Rebalance list** and **Current Holdings**. A Panorama holdings CSV is optional and overrides the workbook holdings.
3. Review the flags, untick anyone to leave out, then **Create ROAs**. A zip (one `First Last ROA.docx` per client plus `_Batch summary.csv`) goes to Downloads. Upload to Drive and open with Google Docs.

## What each ROA contains
Details and account, risk profile, advice, reasons for the change, alternatives considered, before/after portfolio table, transaction costs (brokerage and Tacking Point spread), no new advice fees, risks, PDS list, client authority to proceed, and appendices (model weights, profile descriptions). No tax content. Client sign-off only.

## Rules built in
- Model comes from the **Rebalance list** tab (adviser override wins). Balanced is split under 60 / 60 and over.
- Trades under $500 are not made; ETF brokerage 0.11% (minimum $12.50, BT Panorama Super PDS 1 July 2026); 0.25% spread on Tacking Point purchases; no spread or fee on other managed funds.
- Ongoing fee is unchanged (1.65% incl. GST, capped at $9,000).
- Excluded accounts and clients with two BT accounts (super + TTR) are left out for a manual ROA.
- Flags: draft or doubtful SOA, SOA profile differs from model, DOB not confirmed, negative cash, balance mismatch, missing AR number.

## Layout
- `src/calc.js` holdings data, model weights, trade and cost logic. **Edit here when the IC changes the models.**
- `src/core.js` the Word document layout and wording.
- `src/app.js` the page logic (reading the workbook, flags, zip).
- `src/index.src.html` page shell. `assets/logo.jpg` logo.
- `build.js` builds one self-contained `dist/index.html`. `.github/workflows/pages.yml` publishes it.
- `tests/test.js` end-to-end test: `ROA_WORKBOOK=/path/to/workbook.xlsx npm test` (needs Playwright installed globally).

## Client data
Never commit client data. `.gitignore` excludes spreadsheets, CSVs, zips and Word files.

## Still to do
DASH version (AYLD instead of Tacking Point, separate model sheet), PDS dates and links, joint-holder signature blocks, compliance review of wording (notes and DRAFT marker are on by default).
