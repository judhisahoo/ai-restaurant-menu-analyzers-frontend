const { execSync } = require('child_process');
const isWin = process.platform === 'win32';
const gradleCmd = isWin ? 'gradlew assembleRelease' : './gradlew assembleRelease';
try {
  console.log("Building standalone release APK...");
  execSync(`cd android && ${gradleCmd}`, { stdio: 'inherit' });
  console.log("Installing standalone release APK...");
  execSync('adb install -r android/app/build/outputs/apk/release/app-release.apk', { stdio: 'inherit' });
  console.log("Install successful. The app is completely standalone!");
} catch (e) {
  process.exit(e.status || 1);
}
