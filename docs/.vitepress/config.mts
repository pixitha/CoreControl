import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "CoreControl",
  description: "Dashboard to manage your entire server infrastructure",
  lastUpdated: true,
  cleanUrls: true,
  metaChunk: true,
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
  ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Installation', link: '/installation' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present CoreControl',
    },

    search: {
      provider: 'local',
    },

    sidebar: [
      {
        text: 'Deploy',
        items: [
          { text: 'Installation', link: '/installation' },
        ]
      },
      {
        text: 'General',
        items: [
          { text: 'Dashboard', link: '/general/Dashboard' },
          { text: 'Servers', link: '/general/Servers' },
          { text: 'Applications', link: '/general/Applications' },
          { text: 'Uptime', link: '/general/Uptime' },
          { text: 'Network', link: '/general/Network' },
          { text: 'Settings', link: '/general/Settings' },
        ]
      },
      {
        text: 'Notifications',
        items: [
          { text: 'General', link: '/notifications/General' },
          { text: 'Email', link: '/notifications/Email' },
          { text: 'Telegram', link: '/notifications/Telegram' },
          { text: 'Discord', link: '/notifications/Discord' },
          { text: 'Gotify', link: '/notifications/Gotify' },
          { text: 'Ntfy', link: '/notifications/Ntfy' },
          { text: 'Pushover', link: '/notifications/Pushover' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/crocofied/corecontrol' },
      { icon: 'buymeacoffee', link: 'https://www.buymeacoffee.com/corecontrol' }
    ]
  }
})
