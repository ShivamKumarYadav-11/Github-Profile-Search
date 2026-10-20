import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

// ⬇️ REPLACE with your real URL after deploy (e.g. https://gh-explorer.vercel.app)
const SITE_URL = 'https://viewgithubprofile.vercel.app/'

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'GitHub Profile Explorer — Search Any GitHub User & Repos | SKY',
    template: '%s | GitHub Profile Explorer',
  },

  description:
    'Search any GitHub username to instantly view their profile, repositories, followers, contribution graph, streak stats, stars and forks — all in one fast dark dashboard.',

  keywords: [
    'GitHub',
    'GitHub Users Account',
    'GitHub Account',
    'GitHub Users',
    'GitHub Profile',
    'GitHub Profile Search',
    'GitHub Search',
    'GitHub User Profile',
    'GitHub profile explorer',
    'GitHub user search',
    'GitHub repositories viewer',
    'GitHub stats checker',
    'GitHub contribution graph',
    'GitHub streak stats',
    'GitHub followers count',
    'analyze GitHub profile',
    'GitHub profile analyzer',
  ],

  authors: [{ name: 'Shivam Kumar Yadav', url: SITE_URL }],
  creator: 'Shivam Kumar Yadav',
  publisher: 'SKY',
  applicationName: 'GitHub Profile Explorer, Github Profile Search',

  alternates: {
    canonical: '/',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  verification: {
  google: 'HXr16UgBCek22aRSv_4KhaidINBoRAc4x3H6efL2oqc', 
},

  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'GitHub Profile Explorer',
    title: 'GitHub Profile Explorer — Search Any GitHub User & Repos',
    description:
      'View any GitHub profile, repos, contribution graph, streak stats, stars & forks in one fast dashboard.',
    images: [
      {
        url: '/Github.png',
        width: 512,
        height: 512,
        alt: 'GitHub Profile Explorer | Github Profile Search',
      },
    ],
  },

  twitter: {
    card: 'summary',
    title: 'GitHub Profile Explorer | SKY',
    description: 'Search any GitHub username to view profile, repos and contribution stats.',
    images: ['/Github.png'],
  },

  icons: {
    icon: '/Github.png',
    apple: '/Github.png',
  },
}

export const viewport = {
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
}

// JSON-LD — helps Google show rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GitHub Profile Explorer',
  url: SITE_URL,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  description:
    'Search any GitHub username to view their profile, repositories, and contribution statistics.',
  author: { '@type': 'Person', name: 'Shivam Kumar Yadav' },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
