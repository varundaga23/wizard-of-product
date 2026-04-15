import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const alt = 'Spellcraft — Wizard of Product'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const [harryP, bgBuffer] = await Promise.all([
    readFile(join(process.cwd(), 'public/assets/fonts/HarryP.woff')),
    sharp(join(process.cwd(), 'public/assets/Landing_Page_Background.avif'))
      .resize(1200, 630, { fit: 'cover' })
      .png()
      .toBuffer(),
  ])

  const bgDataUrl = `data:image/png;base64,${bgBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgDataUrl}
          width={1200}
          height={630}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          alt=""
        />

        {/* Dark overlay for text legibility */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(8,4,1,0.52)',
          display: 'flex',
        }} />

        {/* Decorative corner accents */}
        <div style={{ position: 'absolute', top: 24, left: 24, width: 60, height: 60, borderTop: '2px solid #7a5515', borderLeft: '2px solid #7a5515', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 24, right: 24, width: 60, height: 60, borderTop: '2px solid #7a5515', borderRight: '2px solid #7a5515', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 24, left: 24, width: 60, height: 60, borderBottom: '2px solid #7a5515', borderLeft: '2px solid #7a5515', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderBottom: '2px solid #7a5515', borderRight: '2px solid #7a5515', display: 'flex' }} />

        {/* Subtle radial glow behind text */}
        <div style={{
          position: 'absolute',
          width: 700,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(200,145,40,0.18) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, position: 'relative' }}>
          <div
            style={{
              fontFamily: 'HarryP',
              fontSize: 160,
              color: '#f0c060',
              lineHeight: 1,
              letterSpacing: 2,
            }}
          >
            Spellcraft
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 36,
              color: '#e8b84a',
              letterSpacing: 10,
              lineHeight: 1,
            }}
          >
            WIZARD OF PRODUCT
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'HarryP', data: harryP, style: 'normal' }],
    }
  )
}
