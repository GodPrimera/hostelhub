const mongoose = require("mongoose");
const ROLE = ['Manager', 'Assistant'];

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    matricule: {type: String, required: true, unique: true },
    role: { type: String, enum: ROLE, required: true, default: "Assistant", },
    createdAt: { type: Date, default: Date.now }
})


module.exports = mongoose.model("User", userSchema);