// Builds dist/index.html: one self-contained page (libraries, code and logo inlined).
const fs = require('fs'), path = require('path');
const rd = p => fs.readFileSync(path.join(__dirname, p), 'utf8');
const lib = (pkg, file) => rd(`node_modules/${pkg}/${file}`);
const logo = fs.readFileSync(path.join(__dirname, 'assets/logo.jpg')).toString('base64');
const parts = {
  JSZIP: lib('jszip', 'dist/jszip.min.js'),
  XLSX: lib('xlsx', 'dist/xlsx.mini.min.js'),
  DOCX: lib('docx', 'dist/index.iife.js'),
  CALC: rd('src/calc.js'), CORE: rd('src/core.js'), APP: rd('src/app.js'),
};
const build = require('child_process').execSync('git rev-parse --short HEAD').toString().trim() + ', no appendices, executive summary';
let html = rd('src/index.src.html').split('__BUILD__').join(build).split('__LOGO__').join(logo);
for (const [k, v] of Object.entries(parts)) {
  html = html.split(`<script>__${k}__</script>`).join('<script>' + v.replace(/<\/script/g, '<\\/script') + '</script>');
}
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), html);
console.log('dist/index.html', (html.length / 1e6).toFixed(2) + ' MB');
