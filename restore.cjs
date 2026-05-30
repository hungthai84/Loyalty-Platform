const { execSync } = require('child_process');
execSync('git checkout -- src/views/MarketingView.tsx');
console.log('done');
