import fs from 'fs';
import path from 'path';

function searchInDir(dir: string, pattern: RegExp) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && f !== 'node_modules' && f !== '.git' && f !== 'dist') {
      searchInDir(full, pattern);
    } else if (stat.isFile() && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json') || f.endsWith('.js'))) {
      const content = fs.readFileSync(full, 'utf8');
      if (pattern.test(content)) {
        console.log('Match in file:', full);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (pattern.test(l)) {
            console.log(`  L${idx+1}: ${l.trim().slice(0, 100)}`);
          }
        });
      }
    }
  }
}

console.log('Searching for SANYAMJAIN88 or password references...');
searchInDir('src', /SANYAMJAIN88/i);
searchInDir('scripts', /SANYAMJAIN88/i);
