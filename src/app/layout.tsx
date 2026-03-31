import type { Metadata } from 'next'
import { Cinzel, Cinzel_Decorative, EB_Garamond, Pinyon_Script } from 'next/font/google'
import { PostHogProvider } from './providers'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel',
})

const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cinzel-decorative',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-eb-garamond',
})

const pinyonScript = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pinyon-script',
})

export const metadata: Metadata = {
  title: 'Spellcraft — Wizard of Product',
  description: 'Get sorted. Duel real product legends. Earn Spells. Build your Playbook. Face Lenny in the final duel.',
  openGraph: {
    title: 'Spellcraft — Wizard of Product',
    description: 'Get sorted. Duel real product legends. Earn Spells. Build your Playbook. Face Lenny in the final duel.',
    url: 'https://spellcraft.game',
    siteName: 'Spellcraft',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Spellcraft — Wizard of Product',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spellcraft — Wizard of Product',
    description: 'Get sorted. Duel real product legends. Earn Spells. Build your Playbook. Face Lenny in the final duel.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cinzelDecorative.variable} ${ebGaramond.variable} ${pinyonScript.variable}`}>
      <body><PostHogProvider>{children}</PostHogProvider></body>
    </html>
  )
}
