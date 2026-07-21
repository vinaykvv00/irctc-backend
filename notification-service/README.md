# Notification Service

Kafka consumer that sends IRCTC OTP and welcome emails through SendGrid.

## Prerequisites

- Node.js 18 or newer
- Docker Desktop with Docker Compose
- A SendGrid API key
- A sender address verified in SendGrid

## Environment setup

This service reads only notification-service/.env. It does not read an environment file from the repository root.

From the notification-service directory in PowerShell:

```powershell
Copy-Item .env.example .env
```

Set these required values in notification-service/.env:

```dotenv
SENDGRID_API_KEY=your_real_sendgrid_api_key
MAIL_FROM=your_verified_sender@example.com
```

Keep these local Kafka values unless the infrastructure ports change:

```dotenv
KAFKA_BROKER=localhost:9093
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-service-group
```

Kafka topic names are centralized in shared/constants/kafka-topics.js and are not duplicated in service environment files.

## Install and run

Start the shared infrastructure first from the repository root:

```powershell
docker compose up -d
docker compose ps
```

Then install and start this worker:

```powershell
Set-Location notification-service
npm install
npm run dev
```

The worker subscribes to the OTP and welcome-email topics. Invalid messages or messages that cannot be processed are written to the configured dead-letter topic.

## SendGrid setup

1. Create or sign in to a SendGrid account.
2. Open **Settings > API Keys** and create a key with Mail Send permission.
3. Open **Settings > Sender Authentication** and verify the address used by MAIL_FROM.
4. Put the API key and verified address in notification-service/.env only.

Never commit notification-service/.env.
