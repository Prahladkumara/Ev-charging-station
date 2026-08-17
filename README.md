

**Live demo:** https://prahladkumara.github.io/Ev-charging-station/

## Features

-  Search and filter stations by name, location, charging type, and availability
- View connector types, operating hours, and pricing per station
-  Book a charging slot with date, time, and vehicle details
-  Manage bookings — view and cancel existing reservations
-  Responsive design for mobile and desktop



## Project Structure

```
ev-charging-app/
├── backend/
│   ├── server.js         # Express API server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── App.css        # Styles
│   │   ├── main.jsx       # Entry point
│   │   └── services/
│   │       └── api.js     # API client
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Running Locally

### Backend
```bash
cd backend
npm install
npm run dev
```
The API runs on `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The app runs on `http://localhost:5173`.

## Deployment

- **Backend** is deployed on [Render](https://render.com) (free tier).
- **Frontend** is deployed on [GitHub Pages](https://pages.github.com) via the `gh-pages` package.

To deploy frontend updates:
```bash
cd frontend
npm run deploy
```
