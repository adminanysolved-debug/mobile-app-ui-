const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('client/screens').concat(walk('client/components'));
let changed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Remove variations of the hardcoded color
    content = content.replace(/\s*backgroundColor:\s*["']rgba\(45,\s*39,\s*82,\s*0\.6\)["'],?/g, '');
    content = content.replace(/\s*iconBg:\s*["']rgba\(45,\s*39,\s*82,\s*0\.6\)["'],?/g, '');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log(`Updated ${file}`);
    }
});

console.log('Fixed ' + changed + ' files.');
