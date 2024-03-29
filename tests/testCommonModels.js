const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testOrgIds = [];
const testTeamIds = [];
const testSeasonIds = [];
const testGameIds = [];

async function commonBeforeAll() {
    await db.query("DELETE FROM organizations");
    await db.query("DELETE FROM users");
    await db.query("DELETE FROM user_organizations");
    await db.query("DELETE FROM teams");
    await db.query("DELETE FROM seasons");
	await db.query("DELETE FROM season_teams");
    await db.query("DELETE FROM games");

    await db.query(`
    INSERT INTO users (email, pwd, first_name, last_name, super_admin)
    VALUES ('test1@test.com',
            $1,
            'Bob',
            'Testy',
            TRUE),
            ('test2@test.com',
            $1,
            'Barb',
            'Tasty',
            FALSE),
            ('test3@test.com',
            $1,
            'Bulb',
            'Toasty',
            FALSE)`,
            [await bcrypt.hash("password", BCRYPT_WORK_FACTOR)]);

    const resultsOrgs = await db.query(`
    INSERT INTO organizations (org_name)
    VALUES  ('Org1'),
            ('Org2'),
            ('Org3'),
            ('TestOrg1')
    RETURNING id`);
    testOrgIds.splice(0, 0, ...resultsOrgs.rows.map(r => r.id));

    await db.query(`
    INSERT INTO user_organizations (email, org_id, admin_level)
    VALUES ('test1@test.com',
            $1,
            3),
            ('test2@test.com',
            $1,
            2),
            ('test2@test.com',
            $2,
            1)`,
            [testOrgIds[0], testOrgIds[1]]);

    const resultsSeasons = await db.query(`
    INSERT INTO seasons (title, org_id, tournament_for)
    VALUES ('testSeason1', $1, null),
            ('testSeason2', $1, null)
    RETURNING id`,
    [testOrgIds[0]]);
    testSeasonIds.splice(0, 0, ...resultsSeasons.rows.map(r => r.id));

    const resultsTeams = await db.query(`
    INSERT INTO teams (team_name, color, org_id)
    VALUES ('testTeam1', 'red', $1),
            ('testTeam2', 'black', $1)
    RETURNING id`,
    [testOrgIds[0]]);
    testTeamIds.splice(0, 0, ...resultsTeams.rows.map(r => r.id));

    await db.query(`
    INSERT INTO season_teams (team_id, season_id)
    VALUES ($1, $3), ($2, $3)`,
    [testTeamIds[0], testTeamIds[1], testSeasonIds[0]]);

    const resultsGames = await db.query(`
    INSERT INTO games (team_1_id,
                        team_2_id,
                        game_date,
                        game_time,
                        game_location,
                        team_1_score,
                        team_2_score,
                        notes,
                        season_id)
    VALUES ($1, $2, '2021-12-12', '12:00:00', 'testLocation', 21, 22, 'wow!', $3),
            ($2, $1, null, null, '', null, null, '', $3)
    RETURNING id`,
    [testTeamIds[0], testTeamIds[1], testSeasonIds[0]]);
    testGameIds.splice(0, 0, ...resultsGames.rows.map(r => r.id));
};

async function commonBeforeEach() {
    await db.query("BEGIN");
};

async function commonAfterEach() {
    await db.query("ROLLBACK");
};

async function commonAfterAll() {
    await db.end();
};


module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testOrgIds,
    testTeamIds,
    testSeasonIds,
    testGameIds
};