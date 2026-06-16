const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/views/LoyaltyView.tsx');
let data = fs.readFileSync(p, 'utf8');
const search = `{activeTab === "segmentation" && (`;
const idxStart = data.indexOf(search);
if (idxStart !== -1) {
  const idxEnd = data.indexOf(`{activeTab === "points" && (`);
  if (idxEnd !== -1) {
    data = data.substring(0, idxStart) + data.substring(idxEnd);
    fs.writeFileSync(p, data);
    console.log('Removed segmentation tab');
  }
}
