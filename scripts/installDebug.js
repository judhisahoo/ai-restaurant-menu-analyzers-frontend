const { execSync } = require('child_process');
const isWin = process.platform === 'win32';
const gradleCmd = isWin ? 'gradlew assembleDebug' : './gradlew assembleDebug';
try {
  execSync(`cd android && ${gradleCmd}`, { stdio: 'inherit' });
  execSync('adb install -r android/app/build/outputs/apk/debug/app-debug.apk', { stdio: 'inherit' });
} catch (e) {
  process.exit(e.status || 1);
}
