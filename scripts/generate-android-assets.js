const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateAndroidAssets() {
  const emblemPath = path.join(process.cwd(), 'public', 'phiksniyar-emblem.png');
  const logoPath = path.join(process.cwd(), 'public', 'phiksniyar-logo.png');
  const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

  console.log('Generating Android icons and splash assets from PhiksNiyar official emblem...');

  // 1. Mipmap App Icons
  const iconSizes = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const { dir, size } of iconSizes) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // ic_launcher.png
    await sharp(emblemPath)
      .resize(size, size, { fit: 'contain', background: { r: 16, g: 47, b: 120, alpha: 0 } })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(emblemPath)
      .resize(size, size, { fit: 'contain', background: { r: 16, g: 47, b: 120, alpha: 0 } })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    await sharp(emblemPath)
      .resize(size, size, { fit: 'contain', background: { r: 16, g: 47, b: 120, alpha: 0 } })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`✓ Generated ${dir} icons (${size}x${size})`);
  }

  // 2. Splash Screens
  const splashScreens = [
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const { dir, w, h } of splashScreens) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // Compute logo dimensions relative to screen
    const logoW = Math.min(Math.round(Math.min(w, h) * 0.5), 600);
    const logoBuffer = await sharp(logoPath)
      .resize(logoW, logoW, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 16, g: 47, b: 120, alpha: 1 }, // PhiksNiyar Navy #102F78
      },
    })
      .composite([
        {
          input: logoBuffer,
          gravity: 'center',
        },
      ])
      .png()
      .toFile(path.join(targetDir, 'splash.png'));

    console.log(`✓ Generated ${dir}/splash.png (${w}x${h})`);
  }

  console.log('All Android icons and splash screens generated successfully.');
}

generateAndroidAssets().catch(console.error);
