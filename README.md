
![Logo](https://i.ibb.co/hwSZTJH/Kopie-von-Cash-Mate.png)


# CoreControl

The only dashboard you'll ever need to manage your entire server infrastructure. Keep all your server data organized in one central place, easily add your self-hosted applications with quick access links, and monitor their availability in real-time with built-in uptime tracking. Designed for simplicity and control, it gives you a clear overview of your entire self-hosted setup at a glance.

<a href="https://buymeacoffee.com/corecontrol" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

## Features

- Dashboard: A clear screen with all the important information about your servers (WIP)
- Servers: This allows you to add all your servers (including Hardware Information), with Quicklinks to their Management Panels
- Applications: Add all your self-hosted services to a clear list and track their up and down time
- Networks: Generate visually stunning network flowcharts with ease.

## Screenshots
Login Page:
![Login Page](https://i.ibb.co/tp1shBTh/image.png)

Dashboard Page:
![Dashboard Page](https://i.ibb.co/ymCSQrXZ/image.png)

Servers Page:
![Servers Page](https://i.ibb.co/dsvHXrPw/image.png)

Applications Page:
![Applications Page](https://i.ibb.co/HT8M6pJ0/image.png)

Uptime Page:
![Uptime Page](https://i.ibb.co/q3JQKn3z/image.png)

Network Page:
![Network Page](https://i.ibb.co/Y4SCqsZD/image.png)

Settings Page:
![Settings Page](https://i.ibb.co/23bv8CR0/image.png)

## Roadmap
- [X] Edit Applications, Applications searchbar
- [X] Uptime History
- [ ] Notifications
- [ ] Simple Server Monitoring
- [ ] Improved Network Flowchart with custom elements (like Network switches)
- [ ] Advanced Settings (Disable Uptime Tracking & more)

## Deployment

Simply run this compose.yml:
```yml
services:
  web:
    image: haedlessdev/corecontrol:latest
    ports:
      - "3000:3000"
    environment:
      JWT_SECRET: RANDOM_SECRET
      DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres"
    depends_on:
      - db
      - agent

  agent:
    image: haedlessdev/corecontrol-agent:latest
    environment:
      DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres"

  db:
    image: postgres:17
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Tech Stack & Credits

The application is build with:
- Next.js & Typescript
- Go (for the agent)
- Tailwindcss with [shadcn](shadcn.com)
- PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- Icons by [Lucide](https://lucide.dev/)
- Flowcharts by [React Flow](https://reactflow.dev/)
- Application icons by [selfh.st/icons](selfh.st/icons)
- and a lot of love ❤️

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=crocofied/CoreControl&type=Date)](https://www.star-history.com/#crocofied/CoreControl&Date)

## License

Licensed under the [MIT License](https://github.com/crocofied/CoreControl/blob/main/LICENSE).
