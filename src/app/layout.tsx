import type { Metadata } from 'next'
import { Cinzel, Cinzel_Decorative, EB_Garamond, Pinyon_Script, Lora } from 'next/font/google'
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

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://wizard-of-product.vercel.app'),
  title: 'Spellcraft — Wizard of Product',
  description: 'A wizarding school for product people. Get sorted. Duel real product legends. Earn Spells. Build your Playbook. Guided by Lenny Rachitsky, Keeper of Product Lore.',
  icons: {
    icon: '/assets/Lorethron_crest.png',
    apple: '/assets/Lorethron_crest.png',
  },
  openGraph: {
    title: 'Spellcraft — Wizard of Product',
    description: 'A wizarding school for product people. Get sorted. Duel real product legends. Earn Spells. Build your Playbook. Guided by Lenny Rachitsky, Keeper of Product Lore.',
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
    description: 'A wizarding school for product people. Get sorted. Duel real product legends. Earn Spells. Build your Playbook. Guided by Lenny Rachitsky, Keeper of Product Lore.',
    images: ['/og-image.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Spellcraft — Wizard of Product',
  description: 'A wizarding school for product people. Get sorted. Duel real product legends. Earn Spells. Build your Playbook. Guided by Lenny Rachitsky, Keeper of Product Lore.',
  url: 'https://wizard-of-product.vercel.app',
  genre: ['Educational', 'Trivia', 'Strategy'],
  applicationCategory: 'Game',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Organization',
    name: 'Lorethorn Academy',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cinzelDecorative.variable} ${ebGaramond.variable} ${pinyonScript.variable} ${lora.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body><PostHogProvider>{children}</PostHogProvider></body>
    </html>
  )
}
