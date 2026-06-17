const fs = require('fs');
const lines = fs.readFileSync('src/views/LoyaltyView.tsx', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('{tiers.map((tier) => {'));
const end = lines.findIndex((l, i) => i > start && l.includes('</AnimatePresence>'));
console.log('Start:', start, 'End:', end);
if (start !== -1 && end !== -1) {
    const newLines = [...lines.slice(0, start), ...lines.slice(end - 1)];
    fs.writeFileSync('src/views/LoyaltyView.tsx', newLines.join('\n'));
}
