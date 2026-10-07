# UIT Server Discord

## Technology Badges

![Java 17](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?logo=rabbitmq&logoColor=white)

## Overview

UIT Server Discord is a collaboration platform for UIT students and external users.
Users can join private servers for group chat, video calls, and screen sharing.
The platform also provides moderated document sharing, forums, reports, notifications, and an admin dashboard.
It uses a Spring Boot API, React frontend, PostgreSQL, RabbitMQ, and JWT authentication.

## How to Set Up the Backend

From the repository root, start the required services:

```bash
docker compose up -d mailpit rabbitmq
```

Copy the team-provided `application.properties` file to:

```text
app/backend/src/main/resources/application.properties
```

Run the backend:

```bash
cd app/backend
./gradlew bootRun
```

The API runs at `http://localhost:4000/api`.

## How to Set Up the Frontend

```bash
cd app/frontend
npm ci
npm run dev
```

Built with Cloudian Love Cloud
