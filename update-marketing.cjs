const fs = require('fs');
let code = fs.readFileSync('src/views/MarketingView.tsx', 'utf8');

const importStatement = `import { RichTextEditor } from "@/components/ui/rich-text-editor";\n`;
if (!code.includes('import { RichTextEditor }')) {
  code = code.replace('import React, { useState, useEffect } from "react";', `import React, { useState, useEffect } from "react";\n${importStatement}`);
}

code = code.replace(
  /const \[sgGreetingText, setSgGreetingText\] = useState\(\n\s*"Chúc mừng ngày sinh nhật của bạn! Atelier thân gửi tới bạn những lời chúc mừng thăng hoa nhất. Như một món quà bồi đắp tri ân, chúng tôi đã tự động gửi tặng mã ưu đãi đặc quyền trị giá 5.000 điểm tích lũy cùng mã giảm giá BST Thượng Vy hoàn toàn miễn phí."\n\s*\);/,
  `const [sgGreetingText, setSgGreetingText] = useState("<p>Chúc mừng ngày sinh nhật của bạn! Atelier thân gửi tới bạn những lời chúc mừng thăng hoa nhất.</p><p>Như một món quà bồi đắp tri ân, chúng tôi đã tự động gửi tặng mã ưu đãi đặc quyền trị giá 5.000 điểm tích lũy cùng mã giảm giá BST Thượng Vy hoàn toàn miễn phí.</p>");`
);

code = code.replace(
  /const getSgHtmlPreview = \(\) => \{\n\s*const greetingHtml = sgGreetingText\.replace\(\/\\\\n\/g, "<br \/>"\);/,
  `const getSgHtmlPreview = () => {\n    const greetingHtml = sgGreetingText;`
);

const textareaRegex = /<textarea[\s\S]*?className="w-full p-2\.5 bg-background border rounded-xl text-xs font-semibold leading-relaxed"\n\s*\/>/;
code = code.replace(
  textareaRegex,
  `<RichTextEditor \n            value={sgGreetingText}\n            onChange={setSgGreetingText}\n            className="text-sm font-medium"\n          />`
);

fs.writeFileSync('src/views/MarketingView.tsx', code);
console.log('done');
