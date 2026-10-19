import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const inputMd = path.join(rootDir, 'docs', 'product-vision-and-techstack.md');
const outputPdf = path.join(rootDir, 'docs', 'product-vision-and-techstack.pdf');
const tempHtml = path.join(rootDir, 'docs', '_temp_print.html');

if (!fs.existsSync(inputMd)) {
  console.error(`Error: Input file not found: ${inputMd}`);
  process.exit(1);
}

// 1. Convert markdown to HTML using marked via npx or basic parser
console.log('Converting Markdown to HTML...');
execSync(`npx --yes marked -i "${inputMd}" -o "${tempHtml}"`, { cwd: rootDir });

const rawHtml = fs.readFileSync(tempHtml, 'utf8');

// 2. Wrap in styled HTML document optimized for print & PDF
const styledHtml = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>Hiking Companion - Master Product Vision & Technical Specification</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 13px;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 22px;
      color: #0f172a;
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 8px;
      margin-top: 0;
      margin-bottom: 14px;
    }
    h2 {
      font-size: 17px;
      color: #0369a1;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 5px;
      margin-top: 22px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 14.5px;
      color: #0f172a;
      margin-top: 16px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }
    p, ul, ol {
      margin-top: 0;
      margin-bottom: 8px;
    }
    li {
      margin-bottom: 3px;
    }
    code {
      font-family: Consolas, "Courier New", monospace;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 11.5px;
    }
    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 10px 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: Consolas, "Courier New", monospace;
      font-size: 11px;
      line-height: 1.45;
      page-break-inside: avoid;
      margin: 10px 0;
    }
    pre code {
      background-color: transparent;
      color: #f8fafc;
      padding: 0;
    }
    blockquote {
      border-left: 3.5px solid #0284c7;
      background-color: #f0f9ff;
      margin: 10px 0;
      padding: 8px 12px;
      color: #0369a1;
      border-radius: 0 4px 4px 0;
    }
    hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 16px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
      font-size: 12px;
    }
    th {
      background-color: #f8fafc;
      font-weight: 600;
    }
    .footer-note {
      margin-top: 25px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  ${rawHtml}
  <div class="footer-note">Hiking Companion &bull; Product Vision &amp; Technical Specification &bull; Vertrouwelijk &amp; Levend Document</div>
</body>
</html>`;

fs.writeFileSync(tempHtml, styledHtml, 'utf8');

// 3. Find Edge executable
const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const edgeBin = edgePaths.find(p => fs.existsSync(p));
if (!edgeBin) {
  console.error('Error: Microsoft Edge executable not found for headless PDF printing.');
  process.exit(1);
}

console.log(`Rendering PDF using headless Edge (${edgeBin})...`);
const printCmd = `"${edgeBin}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${outputPdf}" "${tempHtml}"`;

try {
  execSync(printCmd, { stdio: 'inherit' });
  console.log(`\nSuccess! PDF exported to:\n  ${outputPdf}`);
} finally {
  if (fs.existsSync(tempHtml)) {
    fs.unlinkSync(tempHtml);
  }
}
