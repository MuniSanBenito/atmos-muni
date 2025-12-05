import fs from 'fs'
import sharp from 'sharp'

const sizes = [192, 512]
const svg = fs.readFileSync('public/icons/icon.svg')

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}x${size}.png`)
    console.log(`Created icon-${size}x${size}.png`)
  }
}

generateIcons()
  .then(() => console.log('Done!'))
  .catch((err) => console.error('Error:', err))
