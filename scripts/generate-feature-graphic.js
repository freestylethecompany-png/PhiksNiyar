const sharp = require('sharp');
const path = require('path');

async function createFeatureGraphic() {
  const logoPath = path.join(process.cwd(), 'public', 'phiksniyar-logo-horizontal.png');
  const outputPath = path.join(process.cwd(), 'public', 'phiksniyar-feature-graphic.png');

  // Resize horizontal logo to fit nicely on 1024x500 banner
  const resizedLogoBuffer = await sharp(logoPath)
    .resize(720, 220, { fit: 'contain', background: { r: 16, g: 47, b: 120, alpha: 0 } })
    .toBuffer();

  // Create 1024x500 banner in Navy #102F78
  await sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: { r: 16, g: 47, b: 120, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedLogoBuffer,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(outputPath);

  console.log('✓ Successfully generated Google Play Feature Graphic (1024x500):', outputPath);
}

createFeatureGraphic().catch(console.error);
