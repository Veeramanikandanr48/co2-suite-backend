# CO2 Suite Backend

Backend service for the **CO2 Suite** built with NestJS, TypeORM, and Node.js.

## Prerequisites

- **Node.js**: v18+ or v20+
- **Database**: PostgreSQL
- **Package Manager**: npm

## Getting Started

### 1. Environment Setup

Create a `.env` file in the root directory based on `sample-env.txt`:

```bash
cp sample-env.txt .env
```

Fill in the required database credentials, JWT secrets, and SMTP mail configuration.

### 2. Install Dependencies

```bash
npm install
```

### 3. Running the App

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### 4. Build & Verification

```bash
# Build the production bundle
npm run build

# Run tests
npm test
```

## Tech Stack

- **Framework**: NestJS 11
- **Database ORM**: TypeORM
- **Authentication**: JWT & Passport
- **Documentation**: Swagger API
