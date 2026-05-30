const fs = require('fs');
let code = fs.readFileSync('src/views/AnalysisView.tsx', 'utf8');

code = code.replace(
  'const merged = [...INITIAL_CUSTOMERS];',
  'const merged = [...INITIAL_CUSTOMERS] as any[];'
);

code = code.replace(
  'return merged;\n  }, [dbCustomers]);',
  'return merged as Customer[];\n  }, [dbCustomers]);'
);

fs.writeFileSync('src/views/AnalysisView.tsx', code);
console.log('done');
