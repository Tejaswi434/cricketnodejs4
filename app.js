const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
const change = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};
initializeDBAndServer();
app.get("/players/", async (request, response) => {
  const details = `select * from player_details
    order by player_id;`;
  const multipledetails = await db.all(details);
  response.send(multipledetails.map((each) => change(each)));
});
app.get("/players/:playerId/", async (request, respond) => {
  const { playerId } = request.params;
  const p = `select * from player_details where player_id=${playerId};`;
  const player = await db.get(p);
  respond.send(player);
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const data = request.body;
  const { playerName } = data;
  const p = `update player_details set player_name='${playerName}' where player_id='${playerId}';`;
  const player = await db.run(p);
  response.send("Player Details Updated");
});
const res = (order) => {
  return {
    matchId: order.match_id,
    match: order.match,
    year: order.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const gettingdata = `select * from match_details
    where match_id='${matchId}';`;
  const order = await db.get(gettingdata);
  response.send(res(order));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const club = `select *  
  from player_match_score  
  natural join match_details 
  where player_id='${playerId}';`;
  const gettingmultiple = await db.all(club);
  response.send(gettingmultiple.map((order) => res(order)));
});
const gr = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `select * from player_details natural join  player_match_score
    where match_id='${matchId}';`;
  const gettingdata = await db.all(query);
  response.send(gettingdata.map((each) => gr(each)));
});
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const databases = `select player_id as playerId,player_name as playerName,sum(score) as totalScore,
    sum(fours) as totalFours,sum(sixes) as totalSixes
     from player_match_score Natural join player_details
    where player_id='${playerId}';`;
  const data = await db.all(databases);
  response.send(data);
});
module.exports = app;
