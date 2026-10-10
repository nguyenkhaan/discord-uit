# Backend

Spring Boot REST API for authentication, users, notifications, email verification, and the main UIT Server Discord data model.

## Folder structure

Generated folders such as `build/`, `bin/`, and `.gradle/` are not shown.

```text
backend/
├── src/
│   ├── main/
│   │   ├── java/com/cloudian/backend/
│   │   │   ├── BackendApplication.java   # Starts the Spring Boot application
│   │   │   ├── commons/                 # Shared constants and enums
│   │   │   ├── configs/                 # CORS, JPA, OpenAPI, and Redis configuration
│   │   │   ├── events/                  # Application events, such as email verification
│   │   │   ├── exceptions/              # API errors and global error handling
│   │   │   ├── filters/                 # JWT request authentication
│   │   │   ├── messagings/              # Shared Kafka producer and consumer
│   │   │   ├── models/                  # JPA database entities and composite IDs
│   │   │   ├── modules/
│   │   │   │   ├── auth/                # Register, login, and email verification
│   │   │   │   ├── health/              # Health-check endpoint
│   │   │   │   ├── notification/        # Notification API and Kafka publishing
│   │   │   │   └── user/                # Current-user profile API
│   │   │   ├── repositories/             # Spring Data database access
│   │   │   ├── security/                 # Spring Security rules and user details
│   │   │   ├── services/                 # Email, Redis, and authentication services
│   │   │   └── utils/                    # JWT, email, and token helpers
│   │   └── resources/
│   │       ├── application.properties     # Local secrets and runtime settings
│   │       ├── META-INF/orm.xml           # JPA mapping settings
│   │       └── templates/email/           # HTML email templates
│   └── test/                              # Unit and integration tests
├── gradle/wrapper/                    # Gradle Wrapper files
├── build.gradle                       # Dependencies and build tasks
├── settings.gradle                    # Gradle project name
├── gradlew / gradlew.bat              # Gradle commands for Linux/macOS and Windows
├── compose.yaml                       # Backend-local PostgreSQL file; not the setup source of truth
└── se247.http                         # Sample HTTP requests
```

## How to setup

### Requirements

- Java 17
- Docker with Docker Compose

### 1. Start Docker services

Run this command from the project root. The root `docker-compose.yaml` is the source of truth.

```bash
docker compose up -d kafka kafka-init mailpit minio
```

| Service | Use |
| --- | --- |
| `kafka` | Sends notification events. |
| `kafka-init` | Creates the notification topic, then exits. |
| `mailpit` | Receives local emails. SMTP uses port `1025`; the web inbox uses port `8025`. |
| `minio` | Stores local files. The API uses port `9000`; the console uses port `9001`. |

PostgreSQL and Upstash Redis are external services in the current configuration. Do not start `app/backend/compose.yaml` for the normal setup.

### 2. Add application settings

Store the team-provided configuration file here:

```text
app/backend/src/main/resources/application.properties
```

It contains database, JWT, Upstash Redis, SMTP, and application settings. This file is ignored by Git. Do not commit secrets.

### 3. Start the backend

```bash
cd app/backend
./gradlew bootRun
```

On Windows, use:

```powershell
gradlew.bat bootRun
```

Open these URLs after startup:

- API: `http://localhost:4000/api`
- API documentation: `http://localhost:4000/api/docs`
- Mailpit inbox: `http://localhost:8025`

### Run tests

```bash
cd app/backend
./gradlew test
```
