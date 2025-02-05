# Taskuere

![Taskuere](https://img.shields.io/badge/Taskuere-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-16.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-5.x-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

Taskuere is a modern, full-stack task and appointment scheduling application built with React, Node.js, and MongoDB. It features a beautiful UI, real-time updates, and seamless calendar integration.

## 🌟 Features

- **Smart Scheduling**: Intelligent calendar management with an intuitive scheduling interface
- **Real-time Notifications**: Stay updated with instant notifications and reminders
- **Secure Access**: Role-based access control with enterprise-grade security
- **Fast & Responsive**: Lightning-fast performance with mobile-first design
- **Integration Ready**: Seamless integration with Google Calendar and other platforms
- **Team Management**: Efficient team coordination and resource management

## 🚀 Tech Stack

### Frontend
- React 18
- Material-UI (MUI)
- React Query
- React Router
- Formik & Yup
- React Hot Toast

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Nodemailer
- Google Calendar API

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn
- Git

### Setup Instructions

1. Clone the repository
```bash
git clone https://github.com/yourusername/taskuere.git
cd taskuere
```

2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your configurations
npm run dev
```

3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Update .env with your configurations
npm start
```

## 🔧 Configuration

### Backend Environment Variables (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
```

### Frontend Environment Variables (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## 📱 Screenshots

[Add screenshots of your application here]

## 🌐 API Documentation

### Authentication Endpoints
- POST /api/auth/register - Register a new user
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile

### Appointment Endpoints
- GET /api/appointments - List all appointments
- POST /api/appointments - Create new appointment
- PUT /api/appointments/:id - Update appointment
- DELETE /api/appointments/:id - Delete appointment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Aidan T. - Initial work - [AidanHT](https://github.com/AidanHT)

## 🙏 Acknowledgments

- Material-UI for the amazing component library
- The React team for the excellent framework
- MongoDB for the robust database solution 
