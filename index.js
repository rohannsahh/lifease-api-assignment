const express = require('express');
const mongoose = require('mongoose');
const Match = require('./models/match.js');
const Ball = require('./models/ball.js');
const { body, validationResult } = require('express-validator');

require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(()=> console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err))

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }
  next();
};


app.post('/api/add', 
  [
    body('runsScored').isInt({ min: 0 }).withMessage('Runs scored must be a non-negative integer'),
    body('strikerName').isString().notEmpty().withMessage('Striker name is required and should be a string'),
    body('nonStrikerName').isString().notEmpty().withMessage('Non-striker name is required and should be a string'),
    body('bowlerName').isString().notEmpty().withMessage('Bowler name is required and should be a string'),
    body('isNoBall').isBoolean().withMessage('isNoBall must be a boolean'),
],
validateRequest,

async(req,res)=>{
    try {
        const {matchId ,runsScored , strikerName , nonStrikerName, bowlerName, isNoBall} = req.body;
        
        let match = await Match.findById(matchId);
        if (!match) {
            match = new Match({
                teamRuns: 0,
                teamBallsPlayed: 0,
                batsmanStats: [],
                bowlerStats: [],
                currentRunRate: 0,
                currentOver: '0.0',
            });
        }

        const newBall = new Ball({
            runsScored,
            strikerName,
            nonStrikerName,
            bowlerName,
            isNoBall,
            matchId: match._id,
        });

        await newBall.save();
       

        // update match details
        match.teamRuns += runsScored;
        match.teamBallsPlayed += isNoBall ? 0 : 1 ;
        
        // batman stats
        let striker = match.batsmanStats.find(b => b.name === strikerName);
        if(striker){
            striker.runs += runsScored;
            striker.ballsFaced += 1;
            striker.strikeRate = (striker.runs / striker.ballsFaced) * 100; 
        }else{
            match.batsmanStats.push({
                name: strikerName,
                runs: runsScored,
                ballsFaced: 1,
                strikeRate: (runsScored / 1) * 100,
              });
        }

        // bowler stats
        const bowler = match.bowlerStats.find(b => b.name === bowlerName);
        if (bowler) {
          bowler.runsConceded += runsScored;
          bowler.deliveries += isNoBall ? 0 : 1;
          bowler.noBalls += isNoBall ? 1 : 0;
          bowler.economyRate = bowler.deliveries ? bowler.runsConceded / (bowler.deliveries / 6) : 0;
        } else {
          match.bowlerStats.push({
            name: bowlerName,
            runsConceded: runsScored,
            deliveries: isNoBall ? 0 : 1,
            noBalls: isNoBall ? 1 : 0,
            economyRate: isNoBall ? 0 : runsScored / 6,
          });
        }

         //  current run rate and over
        match.currentRunRate = match.teamBallsPlayed ? match.teamRuns / (match.teamBallsPlayed / 6) : 0;

        match.currentOver = `${Math.floor(match.teamBallsPlayed / 6)}.${match.teamBallsPlayed % 6}`;

        await match.save();

        res.status(201).json({ message: 'Ball data added successfully', newBall });

    } catch (error) {
        res.status(500).json({ error: error.message });

    }
});

app.put('/api/edit', [
  body('ballId').isMongoId().withMessage('Valid ball ID is required'),
  body('runsScored').isInt({ min: 0 }).withMessage('Runs scored must be a non-negative integer'),
  body('strikerName').isString().notEmpty().withMessage('Striker name is required and should be a string'),
  body('nonStrikerName').isString().notEmpty().withMessage('Non-striker name is required and should be a string'),
  body('bowlerName').isString().notEmpty().withMessage('Bowler name is required and should be a string'),
  body('isNoBall').isBoolean().withMessage('isNoBall must be a boolean'),
], validateRequest, async (req, res) => {
  try {
      const { ballId, runsScored, strikerName, nonStrikerName, bowlerName, isNoBall } = req.body;

      // Find the ball by ID
      const ball = await Ball.findById(ballId);
      if (!ball) {
          return res.status(404).json({ error: 'Ball not found' });
      }

      // Find the match that the ball belongs to
      const match = await Match.findById(ball.matchId);
      if (!match) {
          return res.status(404).json({ error: 'Match not found' });
      }

      // Reverse the effects of the old ball data
      match.teamRuns -= ball.runsScored;
      if (!ball.isNoBall) {
          match.teamBallsPlayed -= 1; // Decrement only if it's a legitimate ball
      }

      // Reverse the effects on striker stats
      const oldStriker = match.batsmanStats.find(b => b.name === ball.strikerName);
      if (oldStriker) {
          oldStriker.runs -= ball.runsScored;
          oldStriker.ballsFaced -= ball.isNoBall ? 0 : 1;
          oldStriker.strikeRate = oldStriker.ballsFaced ? (oldStriker.runs / oldStriker.ballsFaced) * 100 : 0;
      }

      // Reverse the effects on bowler stats
      const oldBowler = match.bowlerStats.find(b => b.name === ball.bowlerName);
      if (oldBowler) {
          oldBowler.runsConceded -= ball.runsScored;
          oldBowler.deliveries -= ball.isNoBall ? 0 : 1;
          oldBowler.noBalls -= ball.isNoBall ? 1 : 0;
          oldBowler.economyRate = oldBowler.deliveries ? oldBowler.runsConceded / (oldBowler.deliveries / 6) : 0;
      }

      // Apply the new ball data
      ball.runsScored = runsScored;
      ball.strikerName = strikerName;
      ball.nonStrikerName = nonStrikerName;
      ball.bowlerName = bowlerName;
      ball.isNoBall = isNoBall;
      await ball.save();

      // Apply the new effects
      match.teamRuns += runsScored;
      if (!isNoBall) {
          match.teamBallsPlayed += 1; // Increment only if it's a legitimate ball
      }

      let newStriker = match.batsmanStats.find(b => b.name === strikerName);
      if (!newStriker) {
          newStriker = 
          { 
            name: strikerName, 
            runs: runsScored, 
            ballsFaced: isNoBall ? 0 : 1, 
            strikeRate: strikerName.ballsFaced ? (strikerName.runs / strikerName.ballsFaced) * 100 : 0 
          };
          match.batsmanStats.push(newStriker);
      }
      newStriker.runs += runsScored;
      newStriker.ballsFaced += isNoBall ? 0 : 1;
      newStriker.strikeRate = newStriker.ballsFaced ? (newStriker.runs / newStriker.ballsFaced) * 100 : 0;

      let newBowler = match.bowlerStats.find(b => b.name === bowlerName);
      if (!newBowler) {
          newBowler = 
          { 
            name: bowlerName,
             runsConceded: runsScored,
              deliveries: isNoBall ? 0 : 1, 
              noBalls: isNoBall ? 1 : 0, 
              economyRate: bowlerName.deliveries ? (bowlerName.runsConceded / (bowlerName.deliveries / 6)).toFixed(2) : 0 
            };
          match.bowlerStats.push(newBowler);
      }
      newBowler.runsConceded += runsScored;
      newBowler.deliveries += isNoBall ? 0 : 1;
      newBowler.noBalls += isNoBall ? 1 : 0;
      newBowler.economyRate = newBowler.deliveries ? (newBowler.runsConceded / (newBowler.deliveries / 6)).toFixed(2) : 0;

      // Update current run rate and over
      const completedOvers = Math.floor(match.teamBallsPlayed / 6);
      const ballsInCurrentOver = match.teamBallsPlayed % 6;
      match.currentOver = `${completedOvers}.${ballsInCurrentOver}`;
      match.currentRunRate = match.teamBallsPlayed ? (match.teamRuns / (match.teamBallsPlayed / 6)).toFixed(2) : 0;

      await match.save();

      res.status(200).json({ message: 'Ball data edited successfully!', ball, match });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.get('/api/details', async (req, res) => {
  try {
    const { matchId } = req.query; 

    if (matchId) {
      // If matchId is provided, find the specific match and its ball-by-ball data
      const match = await Match.findById(matchId);

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      const ballByBallData = await Ball.find({ matchId: match._id });
      res.status(200).json({ match, ballByBallData });
    } else {
      // If no matchId is provided, fetch all matches and their ball-by-ball data
      const matches = await Match.find();
      const allMatchesData = await Promise.all(matches.map(async (match) => {
        const ballByBallData = await Ball.find({ matchId: match._id });
        return { match, ballByBallData };
      }));

      res.status(200).json({ matches: allMatchesData });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.delete('/api/delete-ball', async (req, res) => {
  try {
    const { ballId } = req.query;

    // Find the ball by ID
    const ball = await Ball.findById(ballId);
    if (!ball) {
      return res.status(404).json({ error: 'Ball not found' });
    }

    // Find the match that the ball belongs to
    const match = await Match.findById(ball.matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Reverse the effects of the ball data on the match
    match.teamRuns -= ball.runsScored;
    match.teamBallsPlayed -= ball.isNoBall ? 0 : 1;

    const striker = match.batsmanStats.find(b => b.name === ball.strikerName);
    if (striker) {
      striker.runs -= ball.runsScored;
      striker.ballsFaced -= ball.isNoBall ? 0 : 1;
      striker.strikeRate = striker.ballsFaced ? (striker.runs / striker.ballsFaced) * 100 : 0;
    }

    const bowler = match.bowlerStats.find(b => b.name === ball.bowlerName);
    if (bowler) {
      bowler.runsConceded -= ball.runsScored;
      bowler.deliveries -= ball.isNoBall ? 0 : 1;
      bowler.noBalls -= ball.isNoBall ? 1 : 0;
      bowler.economyRate = bowler.deliveries ? bowler.runsConceded / (bowler.deliveries / 6) : 0;
    }

    // Update current run rate and over
    match.currentRunRate = match.teamBallsPlayed ? (match.teamRuns / (match.teamBallsPlayed / 6)).toFixed(2) : 0;
    match.currentOver = `${Math.floor(match.teamBallsPlayed / 6)}.${match.teamBallsPlayed % 6}`;

    // Save the updated match
    await match.save();

    // Delete the ball from the database
await Ball.findByIdAndDelete(ballId);
    res.status(200).json({ message: 'Ball data deleted successfully!', match });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/delete-match', async (req, res) => {
  try {
      const { matchId } = req.query;

      if (!matchId) {
          return res.status(400).json({ error: 'Match ID is required' });
      }

      // Delete the match
      const deletedMatch = await Match.findByIdAndDelete(matchId);

      if (!deletedMatch) {
          return res.status(404).json({ error: 'Match not found' });
      }

      //  delete related balls
      await Ball.deleteMany({ matchId: matchId });

      res.status(200).json({ message: 'Match and related data deleted successfully!' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000 ;
app.listen(PORT , () => {
    console.log(`server is running at port ${PORT}`)
});