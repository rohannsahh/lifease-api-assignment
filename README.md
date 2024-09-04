# Lifease assignment for full stack intern role

This project covers solutions of creating api endpoints for cricket match data. The API supports operations such as adding, editing, retrieving, and deleting ball-by-ball data and match statistics.

  **Deployed url**    
    
      render: https://lifease-api-assignment-1.onrender.com  
        
      postman collection: https://www.postman.com/dark-shuttle-316146/workspace/api-test/collection/29159995-981dee73-0a0e-48ba-995f-552e28346d92?action=share&creator=29159995


## Table of Contents

- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
- [Database Schemas](#database-schemas)
- [API Endpoints](#api-endpoints)
- [Solution Approach](#solution-approach)


## Technology Stack

- **Node.js** with **Express** for server-side logic
- **MongoDB** for database management
- **Mongoose** as the ORM (Object-Relational Mapping)
- **Express Validator** for request validation
- **dotenv** for managing environment variables

## Setup Instructions

To set up the project locally, follow these steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/rohannsahh/lifease-api-assignment.git
   cd lifease-api-assignment

2. **Install Dependencies:**
    ```bash
    npm install

3. **Set Up Environment Variables:**
   Create a .env file in the root of the project and add the following:
    ```bash
    MONGODB_URI=<your-mongodb-uri>
    PORT=3000

4. **Run the Server:**
   ```bash
   npm start
 
## Database Schemas 
1. **Ball Schema structure**
     ```bash
     runsScored
     strikerName
     nonStrikerName
     bowlerName
     isNoBall
     matchId: mongoose.Schema.ObjectId 
     timeStamp
     
2. **Match Schema structure**
    ```bash
    teamRuns
    teamBallsPlayed
    batsmanStats
    bowlerStats
    currentRunRate
    currentOver
    timeStamp

3. **Batsman Schema structure**    
     ```bash
     name
     runs
     ballsFaced
     strikeRate

4. **Bowler Schema structure**     
    ```bash
    name
    runsConceded
    deliveries
    noBalls
    economyRate

## API Endpoints
1. **Add Ball Data**      
*  Endpoint: /api/add  
*  Method: POST  
*  Description: Adds a ball entry to a specific match.  
* Request Body:  
    ```bash
     {
     "matchId": "string",
     "runsScored": 4,
     "strikerName": "Player1",
     "nonStrikerName": "Player2",
     "bowlerName": "Bowler1",
    "isNoBall": false
   }

 
   Response:  
    201: Ball data added successfully, ball data json    
    400: Validation errors.    
    500: Server error.     

2. **Edit Ball Data**   
* Endpoint: /api/edit  
*  Method: PUT  
*  Description: Edits an existing ball entry.  
* Request Body  
     ```bash
   {
    "ballId": "string",
    "runsScored": 6,
    "strikerName": "Player1",
    "nonStrikerName": "Player2",
    "bowlerName": "Bowler1",
    "isNoBall": false
   }  
  
  
Response:  
 200: Ball data edited successfully, ball data json , match data json  
 400: Validation errors.  
 404: Ball or match not found.  
 500: Server error.  

3.**Get Match and Ball Data**  
* Endpoint: /api/details  

* Method: GET  
* Description: Retrieves match details and ball-by-ball data.  
* Query Parameters:  
* matchId : Specific match ID to retrieve data for.  
  
 Response:  
  200: Returns match and ball data.  
  404: Match not found .  
  500: Server error.  
  
4.**Delete Ball Data**  
* Endpoint: /api/delete-ball  
  
* Method: DELETE  
* Description: Deletes a specific ball entry and reverses ball data from match collection  
* Query Parameters:  
* ballId: ID of the ball to delete.  
  
  Response:  
  200: Ball data deleted successfully.  
  404: Ball or match not found.  
  500: Server error.  
  
  
5. **Delete Match**  
* Endpoint: /api/delete-match   
   
* Method: DELETE  
  
* Description: Deletes a specific match and all related ball data.  
* Query Parameters:  
* matchId: ID of the match to delete.  
  
 Response:  
  200: Match and related data deleted successfully.  
  404: Match not found.  
  500: Server error.  
  
## Solution Approach  
  
**Design Considerations:**  
   
* Modular Design: Separate schemas for Match, Ball, Batsman, and Bowler to keep the design modular and scalable.  
   
* Efficient Data Management: For each ball added or edited, relevant statistics like teamRuns, teamBallsPlayed, strikeRate, and economyRate are updated efficiently.  
  
* Error Handling: The application provides robust error handling for invalid inputs and edge cases, ensuring the application remains stable.  
  
* Validation: The use of express-validator ensures that only valid data is processed, reducing the likelihood of data integrity issues.  
  
* RESTful Principles: The API follows RESTful principles, making it easy to understand and integrate   with other systems.  
  
   
**Adding a Ball:**  
  
* Validation: Inputs are validated to ensure they meet the required criteria.  
* Match Lookup: The match corresponding to the matchId is fetched.  
* Ball Data Insertion: A new ball entry is created and linked to the match.  
* Statistics Update: The match and player statistics are updated based on the new ball data.  
  
   
**Editing a Ball:**  
  
* Validation: Inputs are validated.  
* Ball Lookup: The ball to be edited is fetched using ballId.  
* Reversal of Old Data: The effects of the old ball data are reversed from the match statistics.  
* Update with New Data: The ball is updated with new data, and the match statistics are recalculated.  
  
  
**Deleting a Ball:**    
  
* Ball Lookup: The ball to be deleted is fetched.    
* Reversal of Effects: The match statistics are updated to remove the effects of the deleted ball.    
* Deletion: The ball is deleted from the database.    
  
  
**Deleting a Match:**     

* Match Lookup: The match to be deleted is fetched.  
* Cascade Deletion: The match and all associated ball data are deleted.  