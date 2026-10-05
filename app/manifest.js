export default function manifest() {
  return {
    name: 'GitHub Profile Explorer',
    short_name: 'GH Explorer',
    description: 'Search any GitHub username to view profile, repos and contribution stats.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#0d1117',
    icons: [
      {
        src: '/Github.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}