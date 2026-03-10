const { execSync } = require('child_process');
try {
    execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
    console.log('Success');
} catch (e) {
    console.log(e.stdout);
}
