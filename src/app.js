const express = require("express");
const app = express();
const session = require('express-session');
const flash = require('connect-flash')
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override')
const authRoutes = require('./routes/authRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const path = require('path');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(express.urlencoded({ extended:true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24
  }
}));
app.use(methodOverride('_method'));
app.use(flash());

app.use('/', authRoutes);
app.use('/', dashboardRoutes);


module.exports = app;
