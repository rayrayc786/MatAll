# MatAll Backend API

Welcome to the MatAll Backend! This documentation is designed to help you understand the project structure and how everything fits together.

## 📂 Project Structure

- **`controllers/`**: Contains the business logic for each route. This is where the actual work (like saving to the database or processing data) happens.
- **`models/`**: Defines the structure (schema) of your data in MongoDB using Mongoose.
- **`routes/`**: Defines the API endpoints (URLs) and maps them to controllers.
- **`middleware/`**: Functions that run before the controllers (e.g., checking if a user is logged in).
- **`services/`**: Independent modules for external tasks like sending emails, SMS, or running scheduled jobs (cron).
- **`config/`**: Configuration files for the database, Redis, etc.
- **`scripts/`**: Utility scripts for seeding data or maintenance.
- **`server.js`**: The entry point of the application. It sets up the server, connects to the database, and registers routes.

## 🚀 Getting Started

1. **Environment Variables**: Copy `.env.example` to `.env` and fill in your details (MongoDB URI, Port, etc.).
2. **Installation**: Run `npm install`.
3. **Running the Server**: Run `npm start` for production or `npm run dev` (if configured) for development.

## 🛠 Common Tasks

- **Seeding Data**: Scripts are located in the `scripts/` folder. Use `npm run seed` to populate your database with initial data.
- **Adding a Route**:
    1. Create a model in `models/` (if needed).
    2. Create a controller in `controllers/`.
    3. Define the route in `routes/`.
    4. Register the route in `server.js`.

## 📡 Technology Stack

- **Node.js & Express**: Web framework.
- **MongoDB & Mongoose**: Database and ODM.
- **Socket.io**: Real-time communication (for chats/notifications).
- **Redis**: Performance optimization and socket scaling.
