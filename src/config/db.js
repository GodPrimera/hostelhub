const mongoose = require("mongoose");

async function connectDB () {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connection to database successful')
    } catch(err) {
        console.log('Connection to database failed', err)
        process.exit(1)
    }
}

module.exports = connectDB;