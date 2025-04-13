
![Logo](https://i.ibb.co/hwSZTJH/Kopie-von-Cash-Mate.png)


# Dashdict

The only dashboard you'll ever need to manage your entire server infrastructure. Keep all your server data organized in one central place, easily add your self-hosted applications with quick access links, and monitor their availability in real-time with built-in uptime tracking. Designed for simplicity and control, it gives you a clear overview of your entire self-hosted setup at a glance.

## Features

- Dashboard: A clear screen with all the important information about your servers (WIP)
- Servers: This allows you to add all your servers (including Hardware Information), with Quicklinks to their Management Panels
- Applications: Add all your self-hosted services to a clear list and track their up and down time
- Networks: Generate visually stunning network flowcharts with ease.

## Roadmap
- [] Edit Applications, Applications searchbar
- [] Customizable Dashboard
- [] Notifications
- [] Uptime History
- [] Simple Server Monitoring
- [] Improved Network Flowchart with custom elements (like Network switches)
- [] Advanced Settings (Disable Uptime Tracking & more)

## Deployment

Simply run this compose.yml:
```yml
services:
  web:
    image: haedlessdev/corecontrol:latest
    ports:
      - "3000:3000"
    environment:
      LOGIN_EMAIL: "mail@example.com"
      LOGIN_PASSWORD: "SecretPassword"
      JWT_SECRET: RANDOM_SECRET
      ACCOUNT_SECRET: RANDOM_SECRET
      DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres?sslmode=require&schema=public"
    depends_on:
      - db
      - agent

  agent:
    image: haedlessdev/corecontrol-agent:latest
    environment:
      DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres?sslmode=require&schema=public"

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
- and a lot of love ❤️

## License

Licensed under the [MIT License](https://github.com/crocofied/CoreControl/blob/main/LICENSE).
