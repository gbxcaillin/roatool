(function (root) {
function buildDoc(DATA, logo, docx) {
const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, BorderStyle, LevelFormat, Header, Footer, PageNumber, HeadingLevel, PageBreak, TabStopType, ExternalHyperlink } = docx;

const NAVY = '233C5B', RED = 'D7191F', GREY = 'F2F4F7', MID = 'D0D5DD';
const W = 9638; // content width (A4, 1134 margins)
const FONT = 'Arial';

// ---- helpers ----
function runs(text, o = {}) {
  // {{PLACEHOLDER}} is highlighted yellow; **bold** supported
  if (DATA) text = text.replace(/\{\{([A-Z_0-9]+)\}\}/g, (m, k) => (k in DATA.v ? DATA.v[k] : m));
  const out = [];
  const parts = text.split(/(\{\{[^}]+\}\}|\*\*[^*]+\*\*)/g).filter(s => s !== '');
  for (const s of parts) {
    if (s.startsWith('{{')) out.push(new TextRun({ text: s, font: FONT, size: o.size || 20, highlight: 'yellow', bold: o.bold, color: o.color }));
    else if (s.startsWith('**')) out.push(new TextRun({ text: s.slice(2, -2), font: FONT, size: o.size || 20, bold: true, color: o.color }));
    else out.push(new TextRun({ text: s, font: FONT, size: o.size || 20, bold: o.bold, italics: o.italics, color: o.color }));
  }
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o), spacing: { after: o.after ?? 120, line: 288 }, alignment: o.align, keepNext: o.keepNext });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: FONT })] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: FONT })] });
const B = (t, lvl = 0) => new Paragraph({ numbering: { reference: 'bul', level: lvl }, children: runs(t), spacing: { after: 80, line: 276 } });
const note = t => (DATA && DATA.hideNotes) ? new Paragraph({ spacing: { after: 0 }, children: [] }) : new Paragraph({ children: runs(t, { size: 17, italics: true, color: '555555' }), spacing: { after: 120 } });

const border = { style: BorderStyle.SINGLE, size: 4, color: MID };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(t, w, o = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    columnSpan: o.span,
    children: [new Paragraph({ alignment: o.align, children: /^https?:\/\/\S+$/.test(t)
      ? [new ExternalHyperlink({ link: t, children: [new TextRun({ text: t, font: FONT, size: 14, color: '0563C1', underline: {} })] })]
      : runs(t, { size: o.size || 18, bold: o.bold, color: o.color }) })],
  });
}
function table(widths, header, rows, o = {}) {
  const trs = [];
  if (header) trs.push(new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], { fill: NAVY, bold: true, color: 'FFFFFF', align: (o.right || []).includes(i) ? AlignmentType.RIGHT : undefined })) }));
  rows.forEach((r, ri) => trs.push(new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: o.boldLast && ri === rows.length - 1 ? GREY : (o.shadeFirst && i === 0 ? GREY : undefined), bold: (o.boldLast && ri === rows.length - 1) || (o.shadeFirst && i === 0), align: (o.right || []).includes(i) ? AlignmentType.RIGHT : undefined })) })));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: trs });
}
const gap = (n = 120) => new Paragraph({ spacing: { after: n }, children: [] });
const pb = () => new Paragraph({ children: [new PageBreak()] });

// ---- content ----

const cover = [
  new Paragraph({ spacing: { after: 360 }, children: [new ImageRun({ type: 'jpg', data: logo, transformation: { width: 330, height: 165 }, altText: { title: 'Wealth 23 Dealer Group Services', description: 'Wealth 23 Dealer Group Services logo', name: 'logo' } })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Record of Advice', font: FONT, size: 56, bold: true, color: NAVY })] }),
  new Paragraph({ spacing: { after: 360 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: RED, space: 6 } }, children: [new TextRun({ text: 'Updated Wealth 23 model portfolio', font: FONT, size: 28, color: '555555' })] }),
  P('Prepared for', { bold: true, after: 40, color: NAVY }),
  new Paragraph({ spacing: { after: 240 }, children: runs('{{CLIENT_FULL_NAME}}', { size: 36 }) }),
  table([2600, 7038], null, [
    ['Date of advice', '{{ROA_DATE}}'],
    ['Account', '{{PLATFORM}} {{ACCOUNT_TYPE}} – account {{ACCOUNT_NUMBER}}'],
    ['Adviser', '{{ADVISER_NAME}}, an authorised representative of Wealth 23 Dealer Group Services (No. {{AR_NUMBER}})'],
    ['Relevant Statement of Advice', '{{SOA_DATE}}'],
  ], { shadeFirst: true }),
  gap(360),
  P('Wealth 23 Dealer Group Services Pty Ltd  |  ABN 17 667 026 780  |  Australian Financial Services Licence 548844', { size: 17, color: '555555', after: 40 }),
  P('Ground Floor, 470 St Kilda Road, Melbourne VIC 3004  |  (03) 7036 0690  |  clientservices@wealth23dgs.com.au  |  wealth23dgs.com.au', { size: 17, color: '555555', after: 240 }),
  note(DATA ? DATA.cover_note : 'TEMPLATE v0.1 – for compliance review. Yellow fields are filled in automatically for each client from the holdings report, the fact find and the model workbook. Delete this line from client copies.'),
  pb(),
];

const execSum = DATA && DATA.exec ? [
  H1('Summary of our advice'),
  table([2300, 7338], null, DATA.exec, { shadeFirst: true }),
  gap(200),
] : [];

const s1 = [
  H1('1. About this Record of Advice'),
  P('Dear {{CLIENT_FIRST_NAME}},'),
  P('This Record of Advice (ROA) confirms further advice we are giving you about the investments in your {{PLATFORM}} account. It should be read together with the Statement of Advice (SoA) we gave you on {{SOA_DATE}}, which remains the basis for our advice.'),
  P('We are providing this advice as an ROA rather than a new SoA because your relevant personal circumstances and the basis of our earlier advice have not significantly changed, and the advice below is in line with the strategy recommended in that SoA. If your circumstances have changed since then, please tell us before you accept this advice, because we may need to prepare a new SoA.'),
  P('You can ask us for a copy of this ROA at any time. We keep a copy of it for at least seven years.'),
  note('Compliance to confirm the ROA basis wording against the licensee’s further-advice procedures.'),
  H2('What this advice covers'),
  B('Moving your account to the updated Wealth 23 {{MODEL_NAME}} model portfolio.'),
  B('The costs of making that change.'),
  P('It does not change your risk profile, your platform, your ongoing advice arrangement or any other part of your SoA.'),
];

const s2 = [
  H1('2. Your details'),
  table([2900, 6738], null, [
    ['Name', '{{CLIENT_FULL_NAME}}'],
    ['Date of birth', '{{DATE_OF_BIRTH}}'],
    ['Account', '{{PLATFORM}} {{PRODUCT_NAME}}'],
    ['Account number', '{{ACCOUNT_NUMBER}}'],
    ['Account balance', '{{ACCOUNT_BALANCE}} as at {{BALANCE_DATE}}'],
    ['Current model portfolio', '{{CURRENT_MODEL}}'],
    ['Risk profile in your SoA', '{{RISK_PROFILE}}'],
    ['Adviser', '{{ADVISER_NAME}}'],
  ], { shadeFirst: true }),
  gap(),
  P('Please check these details. If anything is wrong, contact us as soon as possible, because it may affect whether this advice is appropriate for you.'),
];

const s3 = [
  H1('3. Your risk profile'),
  P('We agreed with you that your risk profile is **{{RISK_PROFILE}}**. Your account is invested in the Wealth 23 {{MODEL_NAME}} model portfolio, which matches that profile, and the advice in this ROA keeps you in it.'),
  P('{{RISK_PROFILE_DESCRIPTION}}'),
  P('The updated model keeps roughly {{MODEL_GROWTH_PCT}} of the portfolio in growth assets and {{MODEL_DEFENSIVE_PCT}} in defensive assets.'),
  note('Growth/defensive splits come from the Investment Committee model workbook; compliance to note how these compare with the SoA risk profile table (SoA shows Growth 70/30 and High Growth 90/10).'),
];

const s4 = [
  H1('4. Our advice'),
  P('We recommend that your {{PLATFORM}} account stays invested in the Wealth 23 {{MODEL_NAME}} model portfolio, and that it is rebalanced to the updated weights set out in section 6.'),
  H2('Why we are making this change'),
  P('The Wealth 23 Investment Committee reviewed the model portfolios on 4 November 2026. It concluded that the models have had their growth, and that the next three to six months call for a safer approach that protects those gains. The main changes are:'),
  ...(DATA ? DATA.s4_bullets.map(t => B(t)) : [B('(model-specific list of changes)')]),
  P('{{MODEL_SPECIFIC_REASONS}}'),
  H2('How this meets your needs'),
  P('Your objectives and risk profile have not changed. The change keeps your investments in line with your {{RISK_PROFILE}} profile, which we believe is in your best interests. We believe it improves how well your portfolio is positioned for current market conditions without taking more risk than you have told us you are comfortable with.'),
  note('Rationale taken from the IC paper (30 Sep 2026) and the 4 Nov 2026 model decisions. Compliance to confirm client-facing wording; the IC paper is for adviser use only and is not attached.'),
];

const s5 = [
  H1('5. Other options we considered'),
  B('**Do nothing.** You would stay in the old model, with the concentration in US technology and bank-related investments that the Investment Committee wants to reduce.'),
  B('**Move to a different model.** This is not appropriate, because your risk profile has not changed.'),
  B('**Hold more cash.** This would reduce the risk of losses but would also reduce your expected long-term return and would not match your risk profile.'),
];

const holdRows = DATA ? [...DATA.rows, ['Total', '', DATA.totals[0], '100%', DATA.totals[1], '100%', '–']] : [
  ['{{HOLDING_NAME}} ({{HOLDING_CODE}})', '{{ACTION}}', '{{CURRENT_VALUE}}', '{{CURRENT_PCT}}', '{{NEW_VALUE}}', '{{NEW_PCT}}', '{{CHANGE_VALUE}}'],
  ['{{… one row per holding}}', '', '', '', '', '', ''],
  ['Total', '', '{{TOTAL_CURRENT}}', '100%', '{{TOTAL_NEW}}', '100%', '{{TOTAL_CHANGE}}'],
];
const s6 = [
  pb(),
  H1('6. Your portfolio: now and after the change'),
  P('The table shows your account’s current investments, the updated {{MODEL_NAME}} model weights applied to your balance, and the buying and selling needed to get there.'),
  table([2500, 800, 1250, 1000, 1250, 1000, 1838], ['Investment', 'Action', 'Current $', 'Current %', 'New $', 'New %', 'Change $'], holdRows, { boldLast: true, right: [2, 3, 4, 5, 6] }),
  gap(),
  note('Amounts are estimates based on your balance at {{BALANCE_DATE}} and will move with market prices and any cash movements before the trades are made. Selling proceeds are used to buy the new investments, and the cash weight in the model is kept in your account to pay fees and other costs.'),
  ...(DATA ? [note(DATA.threshold_note)] : []),
  H2('Summary of the portfolio'),
  table([3400, 3119, 3119], ['', 'Current', 'After the change'], [
    ['Growth assets', '{{CURRENT_GROWTH_PCT}}', '{{NEW_GROWTH_PCT}}'],
    ['Defensive assets', '{{CURRENT_DEFENSIVE_PCT}}', '{{NEW_DEFENSIVE_PCT}}'],
    ['Estimated running yield (before franking)', '{{CURRENT_YIELD}}', '{{NEW_YIELD}}'],
    ['Estimated Australian bank exposure', '{{CURRENT_BANK}}', '{{NEW_BANK}}'],
  ], { shadeFirst: true }),
  note('Yields and bank exposure are Investment Committee estimates, not product disclosures, and are not a forecast of what you will receive.'),
];

const s7 = [
  H1('7. What it will cost you'),
  P('There are two different kinds of cost in this section. The first two parts (buying and selling costs, and ongoing investment costs) are **costs of investing**. They are **not fees charged by Wealth 23 or your adviser**, and we do not receive any of them. They are paid from your super account, so you do not need to pay anything from your own pocket. The last part (our advice fees) is the only part that is paid to us.'),
  H2('Buying and selling costs (a cost of investing, not our fee)'),
  table([4300, 2500, 2838], ['Item', 'Estimate ($)', 'Basis'], [
    ['Brokerage on {{NUMBER_OF_TRADES}} trades', '{{BROKERAGE_TOTAL}}', '{{BROKERAGE_BASIS}}'],
    ['Buy/sell spreads', '{{SPREAD_TOTAL}}', '{{SPREAD_BASIS}}'],
    ['Total estimated transaction costs', '{{TRANSACTION_TOTAL}}', '{{TRANSACTION_PCT}} of your balance'],
  ], { boldLast: true, right: [1] }),
  gap(),
  P('These costs are taken from your super account when the trades are made. The brokerage goes to the broker that carries out the trades, and any spread goes to the fund. They are the cost of buying and selling the investments, and they are not our fee.'),
  note(DATA ? DATA.cost_note : 'Cost note'),
  H2('Ongoing investment costs (a cost of investing, not our fee)'),
  P('Every fund and ETF charges a management fee for running it. These fees are built into the investments and come out of your super, and none of them is paid to us. The table compares the fees of your current model with the updated model, so you can see how they change.'),
  table([3400, 3119, 3119], ['Weighted investment fee (p.a.)', 'Current model', 'After the change'], [
    ['Percentage', '{{CURRENT_FEE_PCT}}', '{{NEW_FEE_PCT}}'],
    ['Dollars on your balance', '{{CURRENT_FEE_DOLLARS}}', '{{NEW_FEE_DOLLARS}}'],
  ], { shadeFirst: true, right: [1, 2] }),
  gap(),
  note('Investment fees are estimates from the latest published fees (Morningstar screen 3 Nov 2026 and product disclosure statements). Platform and administration fees do not change.'),
  H2('Our advice fees (the only fees paid to us)'),
  B('**No new advice fee** is charged for this ROA. {{CONFIRM_NO_UPFRONT_FEE}}'),
  B('Your **ongoing advice fee does not change**. It continues under your existing ongoing service agreement, at {{ONGOING_FEE_PCT}} of your account balance a year ({{ONGOING_FEE_ESTIMATE}} a year on your current balance). It is paid from your super account in the same way as it is now.'),
  note('Compliance to confirm: no upfront/implementation fee for the ROA batch, and that the existing ongoing fee consent is current for each client.'),
];

const s8 = [
  H1('8. Risks and things to consider'),
  B('**Market risk.** The value of your investments can fall as well as rise. The updated model aims to be more cautious but it does not remove the risk of losses, and past performance is not a reliable indicator of future performance.'),
  B('**Transaction costs and timing.** The costs in section 7 are taken from your super account, and the prices you get will depend on when the trades are made. Delays in confirming your consent can delay the changes, and markets may move in that time.'),
  B('**Out of the market while trades settle.** Part of your portfolio will be held as cash between selling and buying.'),
  B(DATA ? DATA.new_invest_bullet : '**Newly added investments.** {{NEW_INVESTMENTS_RISK}}'),
  B('**Concentration that remains.** The models still hold a large share in Australian shares and US shares. Australian banks and bank-related debt are reduced, not removed, so falls in the Australian banking sector would still affect you.'),
  B(DATA ? DATA.risk_bullet : '**Credit risk.** {{CREDIT_RISK_DETAIL}}'),
  B('**Interest rates and inflation.** Rising rates can reduce the value of bonds, and inflation can reduce the real value of your returns.'),
  B('**Individual rebalancing.** Model portfolios are rebalanced for each client individually, so the investment date and prices you receive may differ from other clients’.'),
  note('Compliance to add any further standard warnings required for further advice.'),
];

const s9 = [
  H1('9. Fees, commissions and conflicts of interest'),
  P('Section 961B of the Corporations Act 2001 (Cth) requires that our advice is in your best interests. We have made it after looking at your relevant personal circumstances, and we will take all reasonable steps, including ceasing to provide further services, to avoid any conflict of interest as soon as we become aware of one.'),
  P('Our fees are described under “Our advice fees” in section 7. The buying, selling and investment costs in section 7 are costs of investing and are not paid to us. Wealth 23 Dealer Group Services receives the fees as licensee and keeps 10%, and the rest is paid to {{ADVISER_NAME}}. We receive no commission on the investments recommended in this ROA, and {{ADVISER_NAME}} has no vested interest in any of them.'),
  P('As an authorised representative of Wealth 23 Dealer Group Services, {{ADVISER_NAME}} may receive allowable non-monetary benefits such as professional development forums and promotional material. Benefits worth more than $300 are not accepted, and a register is kept of those between $100 and $300. Wealth 23 may receive sponsorship from product providers for training and education; advisers do not receive these amounts.'),
  note('Wording taken from the current SoA template. Compliance to confirm that "no commission" is correct for each platform and product.'),
];

const s10 = [
  H1('10. Product information'),
  P('Before you accept this advice, please read the product disclosure statements (PDSs) and the platform guide for the investments in section 6.', { keepNext: true }),
  table([4200, 1600, 3838], ['Product', 'PDS date', 'Where to find it'], DATA ? DATA.pds : [
    ['{{PLATFORM}} {{PRODUCT_NAME}} (platform guide / PDS)', '{{PDS_DATE}}', '{{PDS_LINK}}'],
    ['{{… one row per new or changed holding}}', '', ''],
  ]),
  gap(),
  P('Please also refer to our Financial Services Guide and Privacy Policy, which we have already given you.'),
];

const s11 = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text: '11. What happens next', font: FONT })] }),
  B('If you have any questions or concerns, please talk to us before you accept this advice.'),
  B('If you are comfortable with it and want us to go ahead, sign the Authority to Proceed below and return it to us. Or tell us in writing or by email that you accept.'),
  B('We will then make the changes to your account, and send you confirmation once they are done.'),
  B('If you do not want to go ahead, you do not need to do anything. Your account stays as it is.'),
  gap(),
  H2('Authority to proceed'),
  P('I acknowledge that:'),
  B('I have read, understood and kept a copy of this Record of Advice dated {{ROA_DATE}}, and my Statement of Advice dated {{SOA_DATE}}.'),
  B('My personal circumstances and objectives have not significantly changed since that Statement of Advice.'),
  B('I understand the risks and costs set out in this Record of Advice.'),
  B('I have been given, or told where to find, the Product Disclosure Statements for the investments in this Record of Advice.'),
  P('I authorise {{ADVISER_NAME}} of Wealth 23 Dealer Group Services to make the changes to my {{PLATFORM}} account that are set out in this Record of Advice.', { after: 240 }),
  table([3600, 3400, 2638], ['Name', 'Signature', 'Date'], [['{{CLIENT_FULL_NAME}}', '', '']]),
  gap(),
  ...(DATA ? [] : [note('A second signature block is needed for joint holders if any account has two owners (none expected in the Panorama batch; confirm).')]),
];

// ---- document ----
const doc = new Document({
  creator: 'Wealth 23 Dealer Group Services',
  title: 'Record of Advice – template',
  styles: {
    default: { document: { run: { font: FONT, size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true, color: NAVY }, paragraph: { spacing: { before: 320, after: 160 }, keepNext: true, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RED, space: 4 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 23, bold: true, color: NAVY }, paragraph: { spacing: { before: 220, after: 100 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }, { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 270 } } } }] }] },
  sections: [{
    properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1200, left: 1134, right: 1134, header: 600, footer: 500 } } },
    headers: {
      default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MID, space: 4 } }, tabStops: [{ type: TabStopType.RIGHT, position: W }], children: [new TextRun({ text: 'Record of Advice – ', font: FONT, size: 16, color: '555555' }), ...runs('{{CLIENT_FULL_NAME}}', { size: 16 }), new TextRun({ text: '\tWealth 23 Dealer Group Services', font: FONT, size: 16, color: '555555' })] })] }),
      first: new Header({ children: [new Paragraph({ children: [] })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: W }], children: [new TextRun({ text: 'AFSL 548844  |  ABN 17 667 026 780', font: FONT, size: 16, color: '555555' }), new TextRun({ children: ['\tPage ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: '555555' })] })] }),
      first: new Footer({ children: [new Paragraph({ children: [] })] }),
    },
    children: [...cover, ...execSum, ...s1, ...s2, ...s3, ...s4, ...s5, ...s6, ...s7, ...s8, ...s9, ...s10, ...s11],
  }],
});

return doc;

}
if (typeof module !== 'undefined' && module.exports) module.exports = { buildDoc }; else root.buildDoc = buildDoc;
})(typeof window !== 'undefined' ? window : globalThis);
