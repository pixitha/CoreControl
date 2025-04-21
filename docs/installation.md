# Installation

The easiest way to install CoreControl is using Docker Compose. Follow these steps:

## Docker Compose Installation

::: danger
CoreControl is at an early stage of development and is subject to change. It is not recommended for use in a production environment at this time.
:::

1. Make sure [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) are installed on your system.

2. Create a file named `docker-compose.yml` with the following content:

```yaml
services:
  web:
    image: haedlessdev/corecontrol:latest
    ports:
      - "3000:3000"
    environment:
      JWT_SECRET: RANDOM_SECRET # Replace with a secure random string
      DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres"

  agent:
    image: haedlessdev/corecontrol-agent:latest
    environment:
      DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres"
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 2s
      timeout: 2s
      retries: 10

volumes:
  postgres_data:
```

3. Generate a custom JWT_SECRET with e.g. [jwtsecret.com/generate](https://jwtsecret.com/generate)
3. Start CoreControl with the following command:

```bash
docker-compose up -d
# OR
docker compose up -d
```

5. The application is now available at `http://localhost:3000`.

## Authentication

CoreControl comes with a default administrator account:

- **Email**: admin@example.com
- **Password**: admin

::: warning
For security reasons, it is strongly recommended to change the default credentials immediately after your first login.
:::

You can change the administrator password in the settings after logging in.