const { execSync } = require('child_process');
try {
    console.log("Running tsc...");
    execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
    console.log('Success');
} catch (e) {
    console.log('Error Output:');
    console.log(e.stdout);
}
