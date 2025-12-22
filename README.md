# MarwadTech E-commerce Backend API (TypeScript & MySQL)

A robust RESTful API for an e-commerce platform rebuilt with **TypeScript**, **Node.js**, **Express**, and **MySQL** using the **Sequelize ORM**. This API supports user authentication, product management, and order processing.

## Features

- **TypeScript Implementation**: Fully type-safe codebase for better developer experience and reliability.
- **MySQL with Sequelize**: Relational database management with powerful ORM capabilities.
- **User Authentication**
  - Mobile-based registration and login
  - JWT-based authentication
  - Role-based access control (Admin/User)
  - Protected routes
- **Product Management**
  - CRUD operations for products
  - Category management
  - Image handling (Multer)
- **Error Handling**: Centralized error management with custom `ErrorResponse` class.
- **Logging**: Advanced logging with Winston and Morgan.

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Logging**: Winston and Morgan

## Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn**

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/anjali04853/marwadtech-backend.git
   cd marwadtech-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Database (MySQL)
   DB_NAME=marwadtech
   DB_USER=root
   DB_PASSWORD=your_password
   DB_HOST=localhost
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   
   # File Upload
   MAX_FILE_UPLOAD=1000000
   UPLOAD_FOLDER=uploads
   ```

4. Initialize the database:
   The application will automatically sync models to your MySQL database if configured in `server.ts`.

## Running the Application

### Development
```bash
# Start the development server with ts-node
npm run dev
```

### Production
```bash
# Build the application
npm run build

# Start the production server
npm start
```

## API Documentation

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile (Protected)

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create a product (Admin only)
- `PUT /api/v1/products/:id` - Update product (Admin only)
- `DELETE /api/v1/products/:id` - Delete product (Admin only)

## License

This project is licensed under the ISC License.

## Author

**anjali04853**
