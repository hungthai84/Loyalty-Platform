import fs from "fs";
import path from "path";
const file = path.resolve(process.cwd(), 'src/components/loyalty/TierComparisonTable.tsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/rounded-lg/g, 'rounded-[10px]');
content = content.replace(/rounded-md/g, 'rounded-[10px]');
fs.writeFileSync(file, content);
console.log("Done");
