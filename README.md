# Cloudian

## Technology Badges

![Java 17](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?logo=rabbitmq&logoColor=white)

## Overview

Cloudian is a student collaboration platform for sharing knowledge, communicating in private groups, and participating in a moderated community. It is designed for UIT students and external users with personal email accounts.

The product scope combines two spaces:

- **Private servers:** Members can join invite-only groups for real-time chat, video calls, and screen sharing. Each server has one shared chat stream; direct messages between users are intentionally out of scope.
- **Public community:** Students can share documents, create forum posts, comment, and search approved content across the platform. Documents and posts are reviewed before becoming public, while an AI agent may suggest classification or moderation results for an administrator to approve.

Cloudian also includes account management, reports, notifications, and an administrator dashboard. Anonymous forum contributions keep a consistent alias within one discussion while protecting the author’s public identity. Private chat and call content are not available for unrestricted administrator access; moderation actions and sensitive reads are intended to be auditable.

The application is organised as a modular Spring Boot backend with a React frontend. The backend exposes REST APIs secured with JWT and documents them through OpenAPI. PostgreSQL stores transactional data, RabbitMQ supports asynchronous work, and the local Docker stack also provides Mailpit for email testing. The broader architecture is designed to support object storage, real-time event delivery, video rooms, OCR, and AI-assisted moderation as the product grows.

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
