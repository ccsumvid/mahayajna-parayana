// electron-builder afterPack hook.
//
// We build with mac.identity=null so electron-builder does NOT sign with the
// keychain's "Apple Distribution" (App Store) cert — that cert makes macOS kill
// the app at launch outside the App Store (EXC_BREAKPOINT). But identity=null
// makes electron-builder skip signing entirely, leaving the .app bundle unsigned,
// and Apple Silicon refuses to GUI-launch an unsigned bundle (it also crashes).
//
// There is no "Developer ID Application" cert available, so we deep AD-HOC sign the
// bundle here — after it's packed, before the DMG is built — so the app launches
// (after the normal Gatekeeper "Open Anyway" for downloaded copies). Runs on macOS
// packs only; no-ops on Windows.
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  console.log(`  • afterPack: deep ad-hoc signing ${appName}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  // Sanity check the signature is valid before the DMG is built.
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' });
};
