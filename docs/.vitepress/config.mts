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
      copyright: 'Copyright © 2025-present CoreControl'
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
          { text: 'Dashboard', link: '/general/dashboard' },
          { text: 'Servers', link: '/general/servers' },
          { text: 'Applications', link: '/general/applications' },
          { text: 'Uptime', link: '/general/uptime' },
          { text: 'Network', link: '/general/network' },
          { text: 'Settings', link: '/general/settings' },
        ]
      },
      {
        text: 'Notifications',
        items: [
          { text: 'Notifications', link: '/notifications/general' },
          { text: 'Email', link: '/notifications/email' },
          { text: 'Telegram', link: '/notifications/telegram' },
          { text: 'Discord', link: '/notifications/discord' },
          { text: 'Gotify', link: '/notifications/gotify' },
          { text: 'Ntfy', link: '/notifications/ntfy' },
        ]
      }
      
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/crocofied/corecontrol' }
    ]
  }
})
