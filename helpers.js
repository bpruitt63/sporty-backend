const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("./config");
const { BadRequestError } = require("./expressError");


/** Creates jsonwebtoken with user information */
function createToken(user) {
    let payload = {
        user: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            superAdmin: user.superAdmin || false,
            organizations: user.organizations
        }
    };
    return jwt.sign(payload, SECRET_KEY);
};

/** Formats data for update queries that may include partial info */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError("No data");
  
    const cols = keys.map((colName, idx) =>
        `"${jsToSql[colName] || colName}"=$${idx + 1}`,
    );
  
    return {
      setCols: cols.join(", "),
      values: Object.values(dataToUpdate),
    };
};

/** Formats data for queries that include variable length
 * array of objects
 */
function sqlForObjectArray(dataArray, jsToSql) {
    if (!dataArray[0]) throw new BadRequestError("No data");
    let dollars = '';
    let values = [];
    let cols = [];
    for (let col of Object.keys(dataArray[0])) {
        cols.push(`${jsToSql[col] || col},`);
    };
    cols = cols.join(' ');
    for (let i = 0; i < dataArray.length; i++) {
        const vals = Object.values(dataArray[i]);
        const dols = [];
        for (let j = 0; j < vals.length; j++) {
            dols.push(`$${(i * vals.length) + (j + 1)}`);
        };
        values = [...values, ...vals];
        dollars = dollars + (dollars ? ', ' : '') +
            `(${dols.join(', ')}, $${(dataArray.length * vals.length) + 1})`;
    };
    return {cols, values, dollars};
};


/**Transforms array of user/organization objects into
 * single user object with object of organization objects
 */
function formatUserInfo(userRows) {
    let user = {
        email: userRows[0].email,
        firstName: userRows[0].firstName,
        lastName: userRows[0].lastName,
        superAdmin: userRows[0].superAdmin,
        organizations: {}
    };
    for (let row of userRows) {
        user.organizations[row.orgId] = {orgName: row.orgName,
                                        adminLevel: row.adminLevel}
    };
    return user;
};


/** Receives data on games, determines if data is regular season (array)
 * or tournament (object).  Sets formatting in either case to expected
 * format for adding games function
 */
function formatGamesList(games) {
    return Array.isArray(games) ? formatSeasonGames(games) 
                                : formatTournamentGames(games);
};

/** Adds tournament related null inputs to season games */
function formatSeasonGames(games) {
    for (let game of games) {
        game.tournamentRound = null;
        game.tournamentGame = null;
    };
    return games;
};

/** Takes nested object format of tournament and converts into array
 * of game objects, with round and game numbers added to each game
 */
function formatTournamentGames(tournament) {
    const gamesArray = [];
    for (let round of Object.keys(tournament)) {
        for (let game of Object.keys(tournament[round])) {
            delete tournament[round][game].team1Name;
            delete tournament[round][game].team2Name;
            delete tournament[round][game].team1Color;
            delete tournament[round][game].team2Color;
            tournament[round][game].tournamentGame = parseInt(game.split(' ')[1]);
            tournament[round][game].tournamentRound = parseInt(round.split(' ')[1]);
            gamesArray.push(tournament[round][game])
        }
    };
    return gamesArray;
};


function gamesListToTournament(games) {
    const tournament = {};
    for (let game of games) {
        if (!(`Round ${game.tournamentRound}` in tournament)) {
            tournament[`Round ${game.tournamentRound}`] = {};
        };
        tournament[`Round ${game.tournamentRound}`][`Game ${game.tournamentGame}`] = game;
    };
    return tournament;
};

  
module.exports = { createToken, 
    sqlForPartialUpdate, 
    formatUserInfo,
    sqlForObjectArray,
    formatGamesList,
    gamesListToTournament };