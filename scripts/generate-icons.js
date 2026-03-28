const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ICON_PATH = 'apps/mobile/ios/mobile/Images.xcassets/AppIcon.appiconset/BookChallengeIcon.png';
const IOS_DIR = 'apps/mobile/ios/mobile/Images.xcassets/AppIcon.appiconset';
const ANDROID_RES_DIR = 'apps/mobile/android/app/src/main/res';

const iosSizes = [
  { size: 20, scale: 1, name: 'Icon-App-20x20@1x.png' },
  { size: 20, scale: 2, name: 'Icon-App-20x20@2x.png' },
  { size: 20, scale: 3, name: 'Icon-App-20x20@3x.png' },
  { size: 29, scale: 1, name: 'Icon-App-29x29@1x.png' },
  { size: 29, scale: 2, name: 'Icon-App-29x29@2x.png' },
  { size: 29, scale: 3, name: 'Icon-App-29x29@3x.png' },
  { size: 40, scale: 1, name: 'Icon-App-40x40@1x.png' },
  { size: 40, scale: 2, name: 'Icon-App-40x40@2x.png' },
  { size: 40, scale: 3, name: 'Icon-App-40x40@3x.png' },
  { size: 60, scale: 2, name: 'Icon-App-60x60@2x.png' },
  { size: 60, scale: 3, name: 'Icon-App-60x60@3x.png' },
  { size: 1024, scale: 1, name: 'Icon-App-1024x1024@1x.png' }
];

const androidSizes = [
  { size: 48, dir: 'mipmap-mdpi' },
  { size: 72, dir: 'mipmap-hdpi' },
  { size: 96, dir: 'mipmap-xhdpi' },
  { size: 144, dir: 'mipmap-xxhdpi' },
  { size: 192, dir: 'mipmap-xxxhdpi' }
];

function generate() {
  try {
    if (!fs.existsSync(ICON_PATH)) {
      console.error('Source icon not found:', ICON_PATH);
      return;
    }
    
    // Convert to absolute path for sips
    const absPath = path.resolve(ICON_PATH);

    // iOS
    for (const spec of iosSizes) {
      const dim = spec.size * spec.scale;
      const file = path.join(IOS_DIR, spec.name);
      // sips -z <height> <width>
      execSync(`sips -z ${dim} ${dim} "${absPath}" --out "${file}"`);
      console.log(`Generated iOS: ${spec.name} (${dim}x${dim})`);
    }

    // Android
    for (const spec of androidSizes) {
      const dir = path.join(ANDROID_RES_DIR, spec.dir);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, 'ic_launcher.png');
      const roundFile = path.join(dir, 'ic_launcher_round.png');
      
      execSync(`sips -z ${spec.size} ${spec.size} "${absPath}" --out "${file}"`);
      execSync(`sips -z ${spec.size} ${spec.size} "${absPath}" --out "${roundFile}"`);
      
      console.log(`Generated Android: ${spec.dir} (${spec.size}x${spec.size})`);
    }

    // Update iOS Contents.json
    const contents = {
      images: iosSizes.map(spec => ({
        size: `${spec.size}x${spec.size}`,
        expectedlegacy: true,
        idiom: spec.size === 1024 ? "ios-marketing" : "iphone",
        filename: spec.name,
        scale: `${spec.scale}x`
      })),
      info: {
        version: 1,
        author: "xcode"
      }
    };
    
    fs.writeFileSync(path.join(IOS_DIR, 'Contents.json'), JSON.stringify(contents, null, 2));
    console.log('Updated iOS Contents.json');

  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generate();
