const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const { sqlForObjectArray,
        sqlForPartialUpdate } = require("../helpers");

class Organization {

    /******************** ORGANIZATIONS ************************/

    //Retrieve a single organization by ID
    static async get(orgId) {
        const result = await db.query(
            `SELECT id AS "orgId",
                    org_name AS "orgName"
            FROM organizations
            WHERE id = $1`,
            [orgId]
        );

        const org = result.rows[0];

        if (org) return org;
        throw new NotFoundError("Organization not found");
    };

    //Perform a fuzzy search of organization names
    static async search(orgName) {
        const result = await db.query(
            `SELECT id AS "orgId",
                    org_name AS "orgName"
            FROM organizations
            WHERE SIMILARITY (org_name, $1) > 0.2
            ORDER BY SIMILARITY (org_name, $1) DESC
            LIMIT 10`,
            [orgName]
        );

        const orgs = result.rows;
        return orgs;
    };

    //Add a new organization
    static async add(orgName) {
        const result = await db.query(
            `INSERT INTO organizations
                (org_name)
            VALUES ($1)
            RETURNING id AS "orgId",
                org_name AS "orgName"`,
            [orgName]
        );

        const org = result.rows[0];
        return org;
    };

    //Update organization name
    static async update(orgId, orgName){
        const result = await db.query(
            `UPDATE organizations
            SET org_name = $1
            WHERE id = $2
            RETURNING id AS "orgId",
                org_name AS "orgName"`,
            [orgName, orgId]
        );
        const org = result.rows[0];
        if (!org) throw new NotFoundError('Organization not found');
        return org;
    };

    //Delete organization
    static async remove(orgId) {
        const result = await db.query(
            `DELETE FROM organizations
            WHERE id = $1
            RETURNING id`,
            [orgId]
        );
        const org = result.rows[0];
        if (!org) throw new NotFoundError("Organization not found");
    };
 

    /*********************** TEAMS *************************/


    //Add teams to database
    static async addTeams(valueArray, orgId) {

        const jsToSql = {teamName: 'team_name'};

        const {cols, values, dollars} = sqlForObjectArray(valueArray, jsToSql);

        const result = await db.query(
            `INSERT INTO teams (${cols} org_id)
            VALUES ${dollars}
            RETURNING id AS "teamId", 
                    team_name AS "teamName", 
                    color,
                    org_id AS "orgId"`,
            [...values, orgId]
        );

        const teams = result.rows;
        if (!teams[0]) throw new NotFoundError("Organization not found");
        return teams;
    };

    //Add teams to season
    static async seasonTeams(valueArray, seasonId) {

        const jsToSql = {teamId: 'team_id'};

        const {cols, values, dollars} = sqlForObjectArray(valueArray, jsToSql);

        const result = await db.query(
            `WITH t AS (
                INSERT INTO season_teams (${cols} season_id)
                VALUES ${dollars}
                RETURNING season_id AS "seasonId", 
                        team_id AS "teamId")
            SELECT t.*, (
                    SELECT team_name FROM teams
                    WHERE t."teamId" = id
                ) AS "teamName",
                (
                    SELECT color FROM teams
                    WHERE t."teamId" = id
                ) AS "color" FROM t`,
            [...values, seasonId]
        );

        const seasonTeams = result.rows;
        if (!seasonTeams[0]) throw new NotFoundError("Organization not found");
        return seasonTeams;
    };

    //Get all teams from a season
    static async getTeams(seasonId) {
        const result = await db.query(
            `SELECT id AS "teamId",
                    color,
                    team_name AS "teamName"
            FROM season_teams
            JOIN teams ON team_id = teams.id
            WHERE season_id = $1`,
            [seasonId]
        );
        const teams = result.rows;
        if (!teams[0]) throw new NotFoundError("No teams found for season");
        return teams;
    };

    //Get single team basic info
    static async getTeam(teamId) {
        const result = await db.query(
            `SELECT teams.id AS "teamId",
                    team_name AS "teamName",
                    color,
                    season_id AS "seasonId",
                    teams.org_id AS "orgId"
            FROM teams JOIN season_teams ON
            teams.id = team_id
            JOIN seasons ON 
                season_teams.season_id = seasons.id
            WHERE teams.id = $1`,
            [teamId]
        );
        const team = result.rows[0];
        if (!team) throw new NotFoundError("Team not found");
        return team;
    };

    //Edit team
    static async updateTeam(teamId, data) {
        const result = await db.query(
            `UPDATE teams
            SET team_name = $1,
                color = $2
            WHERE id = $3
            RETURNING id AS "teamId", 
                    team_name AS "teamName",
                    color,
                    org_id AS "orgId"`,
            [data.teamName, data.color, teamId]
        );
        const team = result.rows[0];
        if (!team) throw new NotFoundError("Team not found");
        return team;
    };

    //Delete team
    static async removeTeam(teamId) {
        const result = await db.query(
            `DELETE FROM teams
            WHERE id = $1
            RETURNING id`,
            [teamId]
        );
        const team = result.rows[0];
        if (!team) throw new NotFoundError("Team not found");
    };


    /************************* SEASONS *****************************/


    //Add season to database
    static async addSeason(title, orgId, tournamentFor=null) {

        /**
         * If tournamentFor is provided, checks that provided value exists.
         * Sets to null if doesn't exist
         */
        if (tournamentFor) {
            const checkForeignKey = await db.query(
                `SELECT id FROM seasons WHERE id=$1`,
                [tournamentFor]
            );
            if (!checkForeignKey.rows[0]) tournamentFor = null;
        };

        const result = await db.query(
            `INSERT INTO seasons (title, org_id, tournament_for)
            VALUES ($1, $2, $3)
            RETURNING id AS "seasonId", 
                    title AS "seasonTitle", 
                    org_id AS "orgId",
                    tournament_for AS "tournamentFor"`,
            [title, orgId, tournamentFor]
        );
        const season = result.rows[0];
        if (!season) throw new BadRequestError("Season failed to save");
        return season;
    };

    //Get all seasons from an organization
    static async getSeasons(orgId) {
        const result = await db.query(
            `SELECT id AS "seasonId", title
            FROM seasons
            WHERE org_id = $1
            ORDER BY id DESC`,
            [orgId]
        );
        const seasons = result.rows;
        if (!seasons[0]) throw new NotFoundError("No seasons found for organization");
        return seasons;
    };

    //Get single season basic info along with tournament connections
    static async getSeason(seasonId) {
        const result = await db.query(
            `SELECT s1.id AS "seasonId",
                    s1.title,
                    s1.org_id AS "orgId",
                    s1.tournament_for AS "tournamentFor",
                    s2.id AS "seasonTournament"
            FROM seasons s1 LEFT JOIN seasons s2
            ON s1.id = s2.tournament_for
            WHERE s1.id = $1`,
            [seasonId]
        );
        const season = result.rows[0];
        if (!season) throw new NotFoundError("Season not found");
        return season;
    };

    //Edit season name
    static async updateSeason(seasonId, title) {
        const result = await db.query(
            `UPDATE seasons
            SET title = $1
            WHERE id = $2
            RETURNING id AS "seasonId", 
                    title, 
                    org_id AS "orgId",
                    tournament_for AS "tournamentFor"`,
            [title, seasonId]
        );
        
        const season = result.rows[0];
        if (!season) throw new NotFoundError("Season not found");
        return season;
    };

    //Delete season
    static async removeSeason(seasonId) {
        const result = await db.query(
            `DELETE FROM seasons
            WHERE id = $1
            RETURNING id`,
            [seasonId]
        );
        const season = result.rows[0];
        if (!season) throw new NotFoundError("Season not found");
    };


    /********************* GAMES **************************/


    static async addGames(seasonId, dataArray) {

        const jsToSql = {team1Id: 'team_1_id',
                        team2Id: 'team_2_id',
                        gameDate: 'game_date',
                        gameTime: 'game_time',
                        gameLocation: 'game_location',
                        team1Score: 'team_1_score',
                        team2Score: 'team_2_score',
                        tournamentRound: 'tournament_round',
                        tournamentGame: 'tournament_game'};

        const {cols, values, dollars} = sqlForObjectArray(dataArray, jsToSql)

        const querySql = `WITH games AS (
                INSERT INTO games (
                            ${cols}
                            season_id)
                VALUES ${dollars}
                RETURNING id AS "gameId",
                            team_1_id AS "team1Id",
                            team_2_id AS "team2Id",
                            season_id AS "seasonId",
                            TO_CHAR(game_date, 'YYYY-MM-DD') AS "gameDate",
                            TO_CHAR(game_date, 'Dy MM/DD/YY') AS "readableDate",
                            game_time AS "gameTime",
                            TO_CHAR(game_time, 'HH12:MI AM') AS "readableTime",
                            game_location AS "gameLocation",
                            team_1_score AS "team1Score",
                            team_2_score AS "team2Score",
                            notes,
                            tournament_round AS "tournamentRound",
                            tournament_game AS "tournamentGame")
            SELECT * FROM (
                SELECT games.*, (
                    SELECT team_name FROM teams
                    WHERE games."team1Id" = id
                ) AS "team1Name",
                (
                    SELECT color FROM teams
                    WHERE games."team1Id" = id
                ) AS "team1Color",
                (
                    SELECT team_name FROM teams
                    WHERE games."team2Id" = id
                ) AS "team2Name",
                (
                    SELECT color FROM teams
                    WHERE games."team2Id" = id
                ) AS "team2Color" FROM games
            ) AS allInfo`
        
        const result = await db.query(querySql, [...values, seasonId]);

        const games = result.rows;
        if (!games[0]) throw new BadRequestError('Games not added');
        return games;
    };

    //Get all games in season or team
    static async getGames(id) {

        let query = 'season_id = $1'
        if (id.teamId) query += ' AND (team_1_id = $2 OR team_2_id = $2)';
        const values = id.teamId ? [id.seasonId, id.teamId] : [id.seasonId];

        const result = await db.query(
            `WITH game AS (
                SELECT id AS "gameId",
                        team_1_id AS "team1Id",
                        team_2_id AS "team2Id",
                        season_id AS "seasonId",
                        TO_CHAR(game_date, 'YYYY-MM-DD') AS "gameDate",
                        TO_CHAR(game_date, 'Dy MM/DD/YY') AS "readableDate",
                        game_time AS "gameTime",
                        TO_CHAR(game_time, 'HH12:MI AM') AS "readableTime",
                        game_location AS "gameLocation",
                        team_1_score AS "team1Score",
                        team_2_score AS "team2Score",
                        notes
                FROM games
                WHERE ${query}
                ORDER BY "gameDate", "gameTime")
            SELECT * FROM (
                SELECT game.*, (
                    SELECT title FROM seasons
                    WHERE game."seasonId" = seasons.id
                ) as title,
                (
                    SELECT team_name FROM teams
                    WHERE game."team1Id" = teams.id
                ) AS "team1Name",
                (
                    SELECT color FROM teams
                    WHERE game."team1Id" = teams.id
                ) AS "team1Color",
                (
                    SELECT team_name FROM teams
                    WHERE game."team2Id" = teams.id
                ) AS "team2Name",
                (
                    SELECT color FROM teams
                    WHERE game."team2Id" = teams.id
                ) AS "team2Color" FROM game
            ) AS allInfo`,
            values
        );
        const games = result.rows;
        if (!games[0]) throw new NotFoundError("No games found");
        return games;
    };

    //Get game's organization
    static async getGameOrganization(gameId) {
        const result = await db.query(
            `SELECT org_id AS "orgId"
            FROM games JOIN seasons
            ON season_id = seasons.id
            WHERE games.id = $1`,
            [gameId]
        );
        const org = result.rows[0];
        if (!org) throw new NotFoundError('Game not found');
        return org;
    };

    //Edit game info
    static async updateGame(gameId, data) {
        
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {   team1Id: "team_1_id",
                team2Id: "team_2_id",
                gameDate: "game_date",
                gameTime: "game_time",
                gameLocation: "game_location",
                team1Score: "team_1_score",
                team2Score: "team_2_score"
            });
        const gameVarIdx = "$" + (values.length + 1);

        const querySql = `WITH updated AS (
            UPDATE games 
            SET ${setCols} 
            WHERE id = ${gameVarIdx} 
            RETURNING id AS "gameId",
                            team_1_id AS "team1Id",
                            team_2_id AS "team2Id",
                            season_id AS "seasonId",
                            TO_CHAR(game_date, 'YYYY-MM-DD') AS "gameDate",
                            TO_CHAR(game_date, 'Dy MM/DD/YY') AS "readableDate",
                            game_time AS "gameTime",
                            TO_CHAR(game_time, 'HH12:MI AM') AS "readableTime",
                            game_location AS "gameLocation",
                            team_1_score AS "team1Score",
                            team_2_score AS "team2Score",
                            notes)
            SELECT * FROM (
                SELECT updated.*, (
                    SELECT team_name FROM teams
                    WHERE updated."team1Id" = id
                ) AS "team1Name",
                (
                    SELECT color FROM teams
                    WHERE updated."team1Id" = id
                ) AS "team1Color",
                (
                    SELECT team_name FROM teams
                    WHERE updated."team2Id" = id
                ) AS "team2Name",
                (
                    SELECT color FROM teams
                    WHERE updated."team2Id" = id
                ) AS "team2Color" FROM updated
            ) AS allInfo`
        
        const result = await db.query(querySql, [...values, gameId]);
        const game = result.rows[0];
                            
        if (!game) throw new NotFoundError(`Game not found`);
                            
        return game;
    };

    //Delete game
    static async removeGame(gameId) {
        const result = await db.query(
            `DELETE FROM games
            WHERE id = $1
            RETURNING id`,
            [gameId]
        );
        const game = result.rows[0];
        if (!game) throw new NotFoundError("Game not found");
    };

};

module.exports = Organization;