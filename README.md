# Star Citizen Stanton Map

An interactive 3D visualization of the Star Citizen Stanton system with user-created alert functionality, built as a Progressive Web Application (PWA).

## Features

- 3D rendering of the Stanton system with stars, planets, moons, stations, and outposts
- User authentication via Firebase
- Create, view, and manage alerts in the 3D space
- Interactive navigation with hover details
- Full Progressive Web App functionality for offline use
- Responsive design with Tailwind CSS

## Tech Stack

- React with TypeScript
- Three.js with react-three-fiber for 3D rendering
- Firebase for authentication and data storage
- Tailwind CSS for styling
- Vite for development and building
- PWA capabilities using vite-plugin-pwa

## Setup Instructions

1. Clone this repository
2. Install dependencies
   ```
   npm install
   ```
3. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
4. Enable Authentication (Email/Password and Anonymous) in your Firebase project
5. Create a Firestore database in your Firebase project
6. Copy `.env.example` to `.env` and fill in your Firebase configuration
7. Start the development server
   ```
   npm run dev
   ```

## Building for Production

```
npm run build
```

The built application will be in the `dist` directory, ready to be deployed.

## Project Structure

- `src/components`: UI components
- `src/models`: TypeScript interfaces and types
- `src/services`: Business logic services
- `src/utils`: Helper functions
- `src/assets`: Static assets
- `src/hooks`: Custom React hooks
- `src/contexts`: React context providers
- `src/pages`: Page components

## Data Sources

The Stanton system data is based on the Star Citizen game data. This project is not affiliated with Cloud Imperium Games or Roberts Space Industries. 