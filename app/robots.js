export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://viewgithubprofile.vercel.app/sitemap.xml', // ⬅️ REPLACE domain
  }
}