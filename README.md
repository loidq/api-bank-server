# 🏦 API Bank Server

## 🚀 Overview

A comprehensive backend API system for digital banking and e-wallet services built with Node.js. This project provides secure, scalable, and robust RESTful APIs for managing financial transactions, user accounts, and seamless integration with major Vietnamese banks and e-wallets.

## ⭐ Key Features & Technical Highlights

- **🛡️ Enterprise-level Security**: Multi-factor authentication (2FA), JWT, Passport.js, rate limiting, and encryption
- **🏗️ Scalable Architecture**: Modular design with clean separation of concerns and background job processing
- **💳 Multi-Platform Integration**: Support for 7+ major financial platforms (ACB, MBBank, TPBank, Vietcombank, Vietinbank, Momo, ZaloPay)
- **📊 Real-time Transaction Processing**: Automated transaction monitoring and processing with queue management
- **🔒 Data Security**: RSA/AES encryption, secure token management, and comprehensive audit logging
- **🎯 Production-Ready**: Rate limiting, error handling, environment configuration, and monitoring capabilities

## 🛠️ Technologies & Libraries

**Core Technologies:**

- Node.js & Express.js
- MongoDB with Mongoose ODM
- Redis for queue management
- JWT & Passport.js for authentication

**Security & Validation:**

- bcryptjs for password hashing
- @hapi/joi for data validation
- helmet for security headers
- express-rate-limit for DDoS protection
- crypto for RSA/AES encryption

**Background Processing:**

- Bull Queue for job processing
- Redis for queue storage
- Automated email notifications

**Banking Integration Libraries:**

- axios for HTTP requests
- node-rsa for encryption
- otplib for 2FA implementation
- qrcode for QR generation

## 🏗️ Project Architecture

```
├── controllers/         # Business logic & API handlers
│   ├── auth.js         # Authentication & authorization
│   ├── bank.js         # Bank account management
│   ├── wallet.js       # E-wallet operations
│   ├── user.js         # User management
│   └── admin/          # Admin panel controllers
├── models/             # Database schemas & models
│   ├── User.js         # User account model
│   ├── Bank.js         # Bank account model
│   ├── Transaction.js  # Transaction records
│   └── Notification.js # Notification system
├── routes/             # API route definitions
├── main/               # Bank integration modules
│   ├── vietcombank.js  # Vietcombank API integration
│   ├── mbbank.js       # MBBank API integration
│   ├── momo.js         # Momo wallet integration
│   ├── zalopay.js      # ZaloPay integration
│   └── queue.js        # Background job processing
├── middlewares/        # Authentication & security
├── config/             # Configuration management
└── utils/              # Utility functions & helpers
```

## ✨ Core Features

### 🔐 Authentication & Security

- **Multi-factor Authentication (2FA)** with QR code generation
- **JWT-based authentication** with secure token management
- **Passport.js integration** for flexible auth strategies
- **Rate limiting** to prevent abuse and DDoS attacks
- **RSA/AES encryption** for sensitive data protection

### 💰 Financial Services

- **Account Management**: Create, update, and manage bank accounts & e-wallets
- **Transaction Processing**: Real-time deposits, withdrawals, and transfers
- **Balance Inquiry**: Live balance checking across multiple platforms
- **Transaction History**: Comprehensive transaction logging and retrieval
- **Automated Reconciliation**: Background processing for transaction matching

### 🏦 Bank & E-wallet Integration

- **Vietcombank (VCB)**: Full API integration with encryption
- **MBBank (MBB)**: Transaction processing and balance inquiry
- **TPBank (TPB)**: Account management and transaction history
- **ACB**: Secure authentication and transaction handling
- **Vietinbank (VTB)**: Session management and API integration
- **Momo**: E-wallet operations and transaction monitoring
- **ZaloPay**: Payment processing and transaction tracking

### 🔄 Background Processing

- **Bull Queue**: Efficient job processing with Redis
- **Email Notifications**: Automated email sending for transactions
- **Transaction Monitoring**: Real-time transaction processing
- **Auto-retry Mechanisms**: Fault-tolerant job execution

### 👥 User Management

- **User Registration & Login**: Secure account creation and authentication
- **Profile Management**: User information and preferences
- **Admin Panel**: Administrative controls and user management
- **Access Control**: Role-based permissions and authorization

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- Redis (for queue processing)
- Environment variables configured

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd api-bank-server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   Create a `.env` file with the following:

   ```env
   DB_HOST=localhost
   DB_PORT=27017
   DB_NAME=api-server
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_jwt_secret
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the server:**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/verify-2fa` - Two-factor authentication

### Bank Management

- `GET /bank/:bank` - List bank accounts
- `POST /bank/:bank` - Add new bank account
- `GET /bank/:bank/getBalance` - Get account balance
- `GET /bank/:bank/getTransaction` - Get transaction history

### Wallet Operations

- `GET /wallet/:bank/getBalance` - Get wallet balance
- `GET /wallet/:bank/getTransaction` - Get wallet transactions

### User Management

- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `POST /security/enable-2fa` - Enable 2FA

## 🛡️ Security Features

- **Rate Limiting**: 80 requests/minute general, 5 requests/minute for auth
- **Input Validation**: Comprehensive data validation with Joi
- **SQL Injection Protection**: MongoDB sanitization
- **XSS Protection**: Helmet security headers
- **CORS Configuration**: Secure cross-origin requests
- **Request IP Tracking**: IP-based monitoring and logging

## 📊 Performance Optimizations

- **Background Job Processing**: Non-blocking operations with Bull Queue
- **Database Indexing**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connections
- **Error Handling**: Comprehensive error management and logging
- **Request Timeout**: Configurable timeout for external API calls

## 🔧 Configuration

The application supports flexible configuration through environment variables and config files:

- Database connection settings
- Redis configuration for queues
- JWT secret management
- Email service configuration
- Bank API credentials and endpoints

## 📝 Testing

Use the provided test files to validate API endpoints:

```bash
# Run test script
node test.js

# Or use the HTTP test file
# Open test.http in VS Code with REST Client extension
```

## 🚀 Deployment

The application is production-ready with:

- Environment-specific configurations
- Comprehensive logging
- Error monitoring
- Health check endpoints
- Docker support (optional)

## 📈 Scalability Features

- **Microservice Architecture**: Modular design for easy scaling
- **Queue-based Processing**: Horizontal scaling for background jobs
- **Database Optimization**: Efficient queries and indexing
- **Load Balancing Ready**: Stateless design for multi-instance deployment

## 🤝 Contributing

This project demonstrates enterprise-level backend development practices:

- Clean code architecture
- Comprehensive error handling
- Security best practices
- Performance optimization
- Scalable design patterns

## 📄 License

This project is for demonstration and educational purposes.

---

**Developer**: Loi DQ  
**Repository**: [api-bank-server](https://github.com/loidq/api-bank-server)  
**Contact**: Available for discussion about implementation details and architecture decisions.
