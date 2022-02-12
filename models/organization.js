const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const { sqlForVariableArraySize, 
        sqlForObjectArray,
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
    static async addTeams(valueArray, seasonId) {

        const values = sqlForVariableArraySize(valueArray);

        const result = await db.query(
            `INSERT INTO teams (team_name, season_id)
            VALUES ${values}
            RETURNING id AS "teamId", 
                    team_name AS "teamName", 
                    season_id AS "seasonId"`,
            [...valueArray, seasonId]
        );

        const teams = result.rows;
        if (!teams[0]) throw new NotFoundError("Organization not found");
        return teams;
    };

    //Get all teams from a season
    static async getTeams(seasonId) {
        const result = await db.query(
            `SELECT id AS "teamId",
                    team_name AS "teamName"
            FROM teams
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
                    season_id AS "seasonId",
                    org_id AS "orgId"
            FROM teams JOIN seasons ON 
                season_id = seasons.id
            WHERE teams.id = $1`,
            [teamId]
        );
        const team = result.rows[0];
        if (!team) throw new NotFoundError("Team not found");
        return team;
    };

    //Edit team name
    static async updateTeam(teamId, name) {
        const result = await db.query(
            `UPDATE teams
            SET team_name = $1
            WHERE id = $2
            RETURNING id AS "teamId", 
                    team_name AS "teamName", 
                    season_id AS "seasonId"`,
            [name, teamId]
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
    static async addSeason(title, orgId) {
        const result = await db.query(
            `INSERT INTO seasons (title, org_id)
            VALUES ($1, $2)
            RETURNING id AS "seasonId", 
                    title AS "seasonTitle", 
                    org_id AS "orgId"`,
            [title, orgId]
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
            WHERE org_id = $1`,
            [orgId]
        );
        const seasons = result.rows;
        if (!seasons[0]) throw new NotFoundError("No seasons found for organization");
        return seasons;
    };

    //Get single season basic info
    static async getSeason(seasonId) {
        const result = await db.query(
            `SELECT id AS "seasonId",
                    title,
                    org_id AS "orgId"
            FROM seasons
            WHERE id = $1`,
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
                    org_id AS "orgId"`,
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

        const {values, dollars} = sqlForObjectArray(dataArray)

        const result = await db.query(
            `INSERT INTO games (
                        team_1_id,
                        team_2_id,
                        game_date,
                        game_time,
                        game_location,
                        team_1_score,
                        team_2_score,
                        notes,
                        season_id)
            VALUES ${dollars}
            RETURNING id AS "gameId",
                        team_1_id AS "team1Id",
                        team_2_id AS "team2Id",
                        season_id AS "seasonId",
                        game_date AS "gameDate",
                        game_time AS "gameTime",
                        game_location AS "gameLocation",
                        team_1_score AS "team1Score",
                        team_2_score AS "team2Score",
                        notes`,
            [...values, seasonId]
        );

        const games = result.rows;
        if (!games[0]) throw new BadRequestError('Games not added');
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
                            game_date AS "gameDate",
                            game_time AS "gameTime",
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
                    SELECT team_name FROM teams
                    WHERE updated."team2Id" = id
                ) AS "team2Name" FROM updated
            ) AS allInfo`
        
        const result = await db.query(querySql, [...values, gameId]);
        const game = result.rows[0];
                            
        if (!game) throw new NotFoundError(`Game not found`);
                            
        return game;
    };

};

module.exports = Organization;