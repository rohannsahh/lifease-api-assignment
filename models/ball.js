const mongoose = require('mongoose');

const BallSchema = new mongoose.Schema({
    runsScored: Number,
    strikerName: String,
    nonStrikerName: String,
    bowlerName: String,
    isNoBall: Boolean,
    matchId:{type: mongoose.Schema.ObjectId , ref:'Match'},
    timeStamp:{type: Date ,default:Date.now },
});

const Ball = mongoose.model('Ball', BallSchema);

module.exports = Ball;