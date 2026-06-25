# StudyNook Server

StudyNook Server is the backend API for the StudyNook library study room booking application. It handles authentication, JWT cookie authorization, room management, booking creation, booking conflict detection, and user-specific data access.

## Live Links

- Server Live URL: Coming soon
- Client Live URL: Coming soon

## Main Features

- User registration
- Email/password login
- Google login support from frontend
- JWT authentication
- HTTP-only cookie based auth
- Protected private APIs
- Create study rooms
- Read all rooms
- Read latest 6 rooms
- Read single room details
- Read logged-in user's own room listings
- Update own rooms only
- Delete own rooms only
- Create bookings
- Prevent overlapping room bookings
- Read logged-in user's bookings
- Cancel own confirmed future bookings
- MongoDB database integration
- CORS configured for frontend connection

## Technologies Used

- Node.js
- Express.js
- MongoDB
- JSON Web Token
- Cookie Parser
- CORS
- bcryptjs
- dotenv
- nodemon

## API Routes

### Health Check

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Server running status |
| GET | `/api/health` | Public | API and database health check |

### Auth Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login user and set JWT cookie |
| POST | `/api/auth/google-login` | Public | Login or create Google user |
| GET | `/api/auth/me` | Private | Get current logged-in user |
| POST | `/api/auth/logout` | Public | Clear JWT cookie |

### Room Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/rooms` | Public | Get all rooms with search/filter |
| GET | `/api/rooms/latest` | Public | Get latest 6 rooms |
| GET | `/api/rooms/my-listings` | Private | Get logged-in user's rooms |
| GET | `/api/rooms/:id` | Public | Get single room details |
| POST | `/api/rooms` | Private | Add a new room |
| PATCH | `/api/rooms/:id` | Private Owner | Update own room |
| DELETE | `/api/rooms/:id` | Private Owner | Delete own room |

### Booking Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/bookings` | Private | Create a booking |
| GET | `/api/bookings/my-bookings` | Private | Get logged-in user's bookings |
| PATCH | `/api/bookings/:id/cancel` | Private Owner | Cancel own booking |

## Booking Conflict Logic

The server prevents overlapping bookings for the same room on the same date. A booking is blocked if another confirmed booking exists where:

```js
existingStartTime < requestedEndTime &&
existingEndTime > requestedStartTime
```

This prevents double booking for the same room and time range.

## Environment Variables

Create a `.env` file in the server root:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string
DB_NAME=studynookDB
JWT_SECRET=your_jwt_secret

DNS_SERVERS=8.8.8.8,1.1.1.1
```

For production, `CLIENT_URL` should be the deployed frontend URL.

Example:

```env
CLIENT_URL=https://your-client.vercel.app
NODE_ENV=production
```

## Installation

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Run production server:

```bash
npm start
```

## Local API URL

```txt
http://localhost:5000
```

## Deployment Notes

The server can be deployed on Render. Add all environment variables in the Render dashboard. Never upload the real `.env` file to GitHub.

For production cookie support, make sure:

```env
NODE_ENV=production
CLIENT_URL=https://your-client.vercel.app
```

## Author

StudyNook Server was developed as part of a full-stack MERN assignment project.