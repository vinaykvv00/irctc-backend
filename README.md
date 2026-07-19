# IRCTC Backend - User Service

A professional backend service for IRCTC (Indian Railways Catering and Tourism Corporation) with user authentication, JWT tokens, OTP verification, and real-time notifications via Kafka.

## 📋 Project Overview

This is a microservices-based backend architecture consisting of:

- **User Service**: Authentication, user management, and OTP verification
- **Notification Service**: Email and SMS notifications via Kafka (separate repository)
- **Infrastructure**: PostgreSQL, Redis, Kafka, Docker Compose

## 🚀 Features

- JWT-based authentication
- Email OTP verification
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
- **Email**: Nodemailer

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

### 2. Install dependencies

```bash
cd user-service
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start infrastructure (Docker Compose)

```bash
# From project root
docker compose up -d
```

### 5. Setup Prisma database

```bash
cd user-service
npx prisma migrate dev
npx prisma generate
```

### 6. Start the service

```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `user-service` directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://admin:irctcpass@localhost:5433/postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=irctcpass

# Kafka
KAFKA_BROKER=localhost:9092

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# OTP
OTP_EXPIRY=300
OTP_LENGTH=6
```

## 🗄️ Database

### Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Open Prisma Studio (GUI)
npm run prisma:studio
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration with email OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

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

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f user-service

# Restart a service
docker compose restart postgres
```

## 🧪 Testing

```bash
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
