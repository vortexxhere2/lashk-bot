const mongoose = require('mongoose');

const tryoutSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    stage: { type: String, required: true },
    level: { type: String, required: true },
    status: { type: String, required: true }
});

module.exports = mongoose.model('Tryout', tryoutSchema);