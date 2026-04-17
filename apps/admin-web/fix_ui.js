const fs = require('fs');
const path = require('path');

const files = [
  'apps/admin-web/src/pages/DashboardOverview.tsx',
  'apps/admin-web/src/pages/Applications.tsx',
  'apps/admin-web/src/pages/JobBoard.tsx',
  'apps/admin-web/src/components/ApplicantViewerModal.tsx'
];

const basePath = 'c:/Users/ADMIN/Downloads/enroute-main';

files.forEach(relPath => {
  const fullPath = path.join(basePath, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${relPath} (not found)`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 1. Legend renaming in DashboardOverview
  if (relPath.includes('DashboardOverview.tsx')) {
    content = content.replace(/<span>Interactions<\/span>/g, '<span>Applications</span>');
    content = content.replace(/>Interactions<\/span>/g, '>Applications</span>');
  }
  
  // 2. Dropdown options black text
  content = content.replace(/<option([^>]*?)>/g, (match, p1) => {
    if (p1.includes('className=')) {
      if (!p1.includes('text-gray-900')) {
        return `<option${p1.replace('className="', 'className="text-gray-900 ')}>`;
      }
      return match;
    }
    return `<option${p1} className="text-gray-900">`;
  });
  
  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${relPath}`);
});
