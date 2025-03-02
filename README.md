# PintPerfect: Guinness Pint Rating App

PintPerfect is a mobile application that allows users to rate and review Guinness pints at pubs, find top-rated pubs, and share their experiences with other Guinness enthusiasts.

<img src="assets/screenshots/screenshot1.png" width="250"> <img src="assets/screenshots/screenshot2.png" width="250"> <img src="assets/screenshots/screenshot3.png" width="250">

## Features

- **Pint Rating System**: Rate pints on a scale of 1-10 with optional comments and photos
- **Pub Discovery**: Find nearby pubs with a map view or list view
- **User Profiles**: Track your ratings and view your rating history
- **Filterable Views**: Sort pubs by highest-rated, proximity, and more
- **Pub Details**: View pub information, ratings, and photos

## Tech Stack

### Frontend (Mobile App)
- **React Native** with **Expo** for cross-platform development
- **Expo Router** for navigation and routing
- **TypeScript** for type safety
- **Expo Location & Maps** for location-based features
- **AsyncStorage** for local data persistence
- **Themed UI Components** for consistent design with light/dark mode support

### Backend
- **Node.js** with **Express** for the API server
- **SQLite** database (with support for future migration to PostgreSQL)
- **JWT** authentication for user accounts
- **Multer** for image uploads
- **bcryptjs** for password hashing

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- iOS Simulator or Android Emulator (optional)

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/pintperfect.git
   cd pintperfect
   ```

2. Install dependencies for the mobile app
   ```bash
   npm install
   ```

3. Set up the backend server
   ```bash
   cd backend
   npm install
   ```

### Running the App

1. Start the backend server
   ```bash
   # In the backend directory
   npm run dev
   ```

2. Seed the database with sample data (optional)
   ```bash
   npm run seed
   ```

3. Start the mobile app
   ```bash
   # In the root directory
   npx expo start
   ```

4. Use the Expo Go app on your device or open in an emulator/simulator
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user information

### Pubs
- `GET /api/pubs` - Get all pubs
- `GET /api/pubs/:id` - Get pub details
- `GET /api/pubs/nearby` - Get pubs near a location
- `POST /api/pubs` - Add a new pub (authenticated)

### Ratings
- `GET /api/ratings/pub/:pubId` - Get all ratings for a pub
- `GET /api/ratings/user/:userId` - Get all ratings by a user
- `POST /api/ratings` - Add a new rating (authenticated)
- `PUT /api/ratings/:id` - Update a rating (authenticated)
- `DELETE /api/ratings/:id` - Delete a rating (authenticated)

### Photos
- `POST /api/photos` - Upload a photo (authenticated)
- `POST /api/photos/base64` - Upload a photo as base64 (authenticated)
- `DELETE /api/photos/:id` - Delete a photo (authenticated)

## Project Structure

```
pintperfect/
├── app/                    # Main app code using Expo Router
│   ├── (tabs)/             # Tab-based navigation screens
│   │   ├── index.tsx       # Home/Feed screen
│   │   ├── map.tsx         # Map view screen
│   │   ├── rate.tsx        # Rate a pint screen
│   │   └── profile.tsx     # User profile screen
│   ├── pub/                # Dynamic routes
│   │   └── [id].tsx        # Pub detail screen
│   └── _layout.tsx         # Root layout component
├── assets/                 # Images, fonts and other static files
├── backend/                # Server-side code
│   ├── models/             # Database models
│   ├── server.js           # Express server setup
│   └── package.json        # Backend dependencies
├── components/             # Reusable React components
├── constants/              # App constants including colors
├── hooks/                  # Custom React hooks
├── services/               # API service functions
├── types/                  # TypeScript type definitions
└── package.json            # Frontend dependencies
```

## Future Enhancements

- Social features (following users, sharing ratings)
- Pub owner accounts to claim and manage pub listings
- Advanced filtering and search options
- Leaderboards for top-rated pubs
- Badges and achievements for active users
- Push notifications for new ratings at favorite pubs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the rich tradition of Guinness and the art of pouring the perfect pint
- Built with Expo and React Native
- Icons from Expo Symbols and SF Symbols
