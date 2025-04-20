---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "CoreControl"
  text: "Manage your server infrastructure"
  tagline: My great project tagline
  actions:
    - theme: brand
      text: Install
      link: /installation
    - theme: alt
      text: GitHub
      link: https://github.com/crocofied/corecontrol
  image:
    src: /logo.png
    alt: Logo

features:
  - title: Feature A
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature B
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature C
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---

<style>
:root {
  --vp-home-hero-image-background-image: linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.25));
  --vp-home-hero-image-filter: blur(100px);
}
</style>