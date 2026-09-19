# Hostel Hub

## Description
A hostel management system

## Setup
1. Clone the repository: run `git clone https://github.com/GodPrimera/expense-tracker.git`
2. Install dependencies: run `npm install`
3. Copy `.env.example` to `.env` and fill in your own values:
   (On Windows: `copy .env.example .env`)
4. Make sure MongoDB is running locally (`mongodb://127.0.0.1:27017` by default).
5. Start the server:run `npm run start`
6. Visit `http://localhost:3000` and sign up

## Environment Variables
- MONGODB_URI - MongoDB connection string
- SESSION_SECRET - secret used to sign session cookies
- PORT - port the server listens on

## Decision

* I decided not to make the add booking form have seperate fields for hostel and room bacause it require more logic which is more complex for a small system and most hostel managers will only control one hostel

## AI assistance

- AI was used to generate the UI of the project since the ui was not my topic of concentration and to save time