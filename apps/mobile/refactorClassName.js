const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    // using powershell syntax since cmd dir /s might hang or fail
    const filesMatch = execSync('Get-ChildItem -Path src -Filter *.tsx -Recurse | Select-Object -ExpandProperty FullName', { shell: 'powershell.exe' })
        .toString()
        .split('\r\n')
        .filter(Boolean);

    for (const f of filesMatch) {
        let content = fs.readFileSync(f, 'utf8');
        let orig = content;

        content = content.replace(/className=\"([^\"]+)\"/g, 'style={tw`$1`}');
        content = content.replace(/className=\{`([^`]+)`\}/g, 'style={tw`$1`}');

        if (content !== orig && !content.includes("import tw from '@/lib/tailwind';")) {
            content = "import tw from '@/lib/tailwind';\n" + content;
            fs.writeFileSync(f, content, 'utf8');
            console.log(`Updated ${f}`);
        } else if (content !== orig) {
            fs.writeFileSync(f, content, 'utf8');
            console.log(`Updated ${f}`);
        }
    }
    console.log("Done refactoring.");
} catch (e) {
    console.error(e);
}
