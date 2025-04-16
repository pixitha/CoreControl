---
icon: down
---

# Installation

To install the application using Docker Compose, first, ensure that Docker and Docker Compose are installed on your system.&#x20;

You can then simply install and start the following Docker compose. Remember that you have to generate a JWT\_SECRET beforehand.

```yaml
services:
  web:
    image: haedlessdev/corecontrol:latest
    ports:
      - "3000:3000"
    environment:
      JWT_SECRET: RANDOM_SECRET # Replace with a secure random string
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

Now start the application:

```sh
docker compose up -d
```



**The default login is:**

E-Mail: [admin@example.com](mailto:admin@example.com)\
Password: admin

_Be sure to set your own password and customize the e-mail, otherwise this poses a security risk!_
