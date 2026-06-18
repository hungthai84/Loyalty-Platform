import fs from "fs";
import path from "path";

function findFiles(dir: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allTsxFiles = findFiles(path.resolve(process.cwd(), 'src'));

let replacedCount = 0;
for (const file of allTsxFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = content.replace(/rounded-xl/g, 'rounded-[10px]');
  content = content.replace(/rounded-2xl/g, 'rounded-[10px]');
  content = content.replace(/rounded-3xl/g, 'rounded-[10px]');
  content = content.replace(/rounded-\[2rem\]/g, 'rounded-[10px]');
  content = content.replace(/rounded-lg/g, 'rounded-[10px]');
  content = content.replace(/rounded-md/g, 'rounded-[10px]');
  if (original !== content) {
    fs.writeFileSync(file, content);
    replacedCount++;
  }
}
console.log("Replaced in", replacedCount, "files.");
