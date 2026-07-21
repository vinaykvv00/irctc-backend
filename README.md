# IRCTC Backend - User Service

A professional backend service for IRCTC (Indian Railways Catering and Tourism Corporation) with user authentication, JWT tokens, OTP verification, and real-time notifications via Kafka.

## 📋 Project Overview

This is a local microservices backend consisting of:

- **User Service**: Authentication, user management, and OTP verification
- **Notification Service**: OTP and welcome emails consumed from Kafka and sent with SendGrid
- **Infrastructure**: PostgreSQL, Redis, Kafka, Docker Compose

## 🚀 Features

- JWT-based authentication
- Email OTP verification through the notification worker
- Device fingerprinting for security
- Redis caching
- Kafka pub/sub messaging
- Prisma ORM with PostgreSQL
- Comprehensive error handling
- Request validation middleware

## 📂 Project Structure

```
user-service/          # Main backend service
├── src/
│   ├── index.js       # Application entry point
│   ├── config/        # Configuration files (DB, Redis, Kafka, Logger)
│   ├── controllers/   # Request handlers
│   ├── routes/        # API routes
│   ├── service/       # Business logic
│   ├── middlewares/   # Express middlewares
│   └── utils/         # Utility functions
├── prisma/            # Database schema and migrations
├── docs/              # API documentation
└── package.json       # Dependencies

docker-compose.yml    # Infrastructure setup
```

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Message Queue**: Apache Kafka
- **Authentication**: JWT
- **Email**: SendGrid

## 📦 Prerequisites

- Docker and Docker Compose
- Node.js 18 or higher
- npm or yarn

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/irctc-backend.git
cd irctc-backend
```

### 2. Start infrastructure first

Docker Compose starts PostgreSQL, pgAdmin, Redis, ZooKeeper, Kafka, and Kafka UI. It does not use a root .env file.

```powershell
docker compose up -d
docker compose ps
```

Wait until the containers are running before starting either Node.js service.

### 3. Configure and start the user service

```powershell
Set-Location user-service
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
```

The local service configuration belongs in user-service/.env. Its Kafka broker must be localhost:9093 because the Node.js process runs on the host.

### 4. Configure and start the notification service

Open a second PowerShell terminal at the repository root:

```powershell
Set-Location notification-service
npm install
Copy-Item .env.example .env
# Set SENDGRID_API_KEY and MAIL_FROM in .env.
npm run dev
```

See [notification-service/README.md](notification-service/README.md) for SendGrid and Kafka settings.

### 5. Verify the flow

1. Keep Docker Compose, the user service, and the notification service running.
2. Call POST /api/v1/auth/send-otp on the user service.
3. The user service stores the OTP in Redis and publishes a notification.otp-email event.
4. The notification service consumes the event and sends the email through SendGrid.
5. After OTP verification, the user service publishes a notification.welcome-email event.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `user-service` directory:

```env
# Local infrastructure connections
DATABASE_URL=postgresql://admin:irctcpass@localhost:5433/postgres
REDIS_URL=redis://:irctcpass@localhost:6379
KAFKA_BROKER=localhost:9093
```

Kafka topic names are centralized in shared/constants/kafka-topics.js. Use user-service/.env.example and notification-service/.env.example as the complete variable lists. No root environment file is required.

## 🗄️ Database

### Prisma Commands

```powershell
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Open Prisma Studio (GUI)
npm run prisma:studio
```

## 🚀 Running the Application

### Development Mode

```powershell
npm run dev
```

### Production Mode

```powershell
npm start
```

## 🔌 API Endpoints

### Authentication

- `POST /api/v1/auth/send-otp` - Generate and publish the signup OTP
- `POST /api/v1/auth/verify-otp` - Verify the OTP and create the user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/refresh` - Rotate the refresh token

## 📊 Infrastructure Services

The `docker-compose.yml` provides:

| Service    | Port      | Purpose           |
| ---------- | --------- | ----------------- |
| PostgreSQL | 5433      | Main database     |
| pgAdmin    | 8081      | Database UI       |
| Redis      | 6379      | Cache layer       |
| Zookeeper  | 2181      | Kafka coordinator |
| Kafka      | 9092/9093 | Message broker    |
| Kafka UI   | 8080      | Kafka management  |

## 🐳 Docker Commands

```powershell
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View infrastructure logs
docker compose logs -f kafka

# Restart a service
docker compose restart postgres
```

## 🧪 Testing

```powershell
npm run test
```

## 📚 Documentation

- [Authentication Concept](./docs/concepts/authentication.md)
- [Kafka Integration](./docs/concepts/kafka.md)
- [Redis Usage](./docs/concepts/redis.md)
- [Message Queues](./docs/concepts/message-queues.md)
- [Setup Guide](./docs/setup/README.md)

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens with expiration
- CORS middleware configured
- Device fingerprinting enabled
- Environment variables for sensitive data

## 🤝 Contributing

1. Create a feature branch
2. Commit changes with clear messages
3. Push to branch
4. Create a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📧 Support

For issues and questions, please create an issue in the GitHub repository.

---

**Note**: The notification-service is maintained in a separate repository for independent deployment.
