require('dotenv').config();
const PORT = process.env.PORT || 3000;
const app = require('./app');
const connectDB = require("./config/db");

connectDB();


app.listen(PORT, () => {
    console.log(`Server running on Port:${PORT}`)
})
