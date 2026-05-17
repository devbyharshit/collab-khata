const fs = require('fs');
let content = fs.readFileSync('apps/frontend/src/app/brands/__tests__/page.test.tsx', 'utf8');

content = content.replace(/data:\s*\{\s*brands:\s*mockBrands,\s*total_count:\s*mockBrands\.length\s*\}/g, 'data: mockBrands');
content = content.replace(/data:\s*\{\s*brands:\s*\[\],\s*total_count:\s*0\s*\}/g, 'data: []');

fs.writeFileSync('apps/frontend/src/app/brands/__tests__/page.test.tsx', content);
