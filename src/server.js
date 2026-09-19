require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const app = require('./app');
const connectDB = require("./config/db");

connectDB();


app.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`)
})
