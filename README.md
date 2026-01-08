# Security_CW2_Assignment

E-Commerce application for Football Supplies Nepal.

## Features
- User Authentication (Login/Register)
- Account Lockout (Security Feature)
- Product Management
- Cart & Orders

## Security Features
- Account lockout after 3 failed attempts (15 minutes duration)
- BCrypt password hashing

## Installation

1. Clone the repository
2. Install Backend Dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install Frontend Dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Setup Environment Variables
   - Create .env in backend

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify 2FA OTP


