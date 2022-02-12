const db = require("../db.js");
const User = require("../models/user");
const Organization = require("../models/organization");
const { createToken } = require("../helpers");

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

    testOrgIds[0] = (await Organization.add('Org1')).orgId;
    testOrgIds[1] = (await Organization.add('Org2')).orgId;
    testOrgIds[2] = (await Organization.add('Org3')).orgId;    

    testSeasonIds[0] = (await Organization.addSeason('testSeason1', testOrgIds[0])).seasonId;
    testSeasonIds[1] = (await Organization.addSeason('testSeason2', testOrgIds[0])).seasonId;

    const testTeams = await Organization.addTeams([{teamName: 'testTeam1', color: 'red'}, 
                                                    {teamName: 'testTeam2', color: 'black'},
                                                    {teamName: 'testTeam3', color: ''}], testOrgIds[0]);
    testTeamIds[0] = testTeams[0].teamId;
    testTeamIds[1] = testTeams[1].teamId;
    testTeamIds[2] = testTeams[2].teamId;

    await Organization.seasonTeams([{teamId: testTeamIds[0]}, 
                                    {teamId: testTeamIds[1]},
                                    {teamId: testTeamIds[2]}], testSeasonIds[0])

    const testGames = await Organization.addGames(testSeasonIds[0], [
        {team1Id: testTeamIds[0],
        team2Id: testTeamIds[1],
        gameDate: '12/12/21',
        gameTime: '12:00 pm',
        gameLocation: 'testLocation',
        team1Score: 21,
        team2Score: 22,
        notes: 'frightening'},
        {team1Id: testTeamIds[1],
        team2Id: testTeamIds[0],
        gameDate: '',
        gameTime: '',
        gameLocation: '',
        team1Score: null,
        team2Score: null,
        notes: ''},
        {team1Id: testTeamIds[1],
        team2Id: testTeamIds[2],
        gameDate: '',
        gameTime: '',
        gameLocation: '',
        team1Score: null,
        team2Score: null,
        notes: ''}
    ]);
    testGameIds[0] = testGames[0].gameId;
    testGameIds[1] = testGames[1].gameId;
    testGameIds[2] = testGames[2].gameId;

    await User.create({
        email: "test1@test.com",
        firstName: "Bob",
        lastName: "Testy",
        pwd: "password1",
        superAdmin: true
    });
    await User.create({
        email: "test2@test.com",
        firstName: "Barb",
        lastName: "Tasty",
        pwd: "password1",
        superAdmin: false
    });
    await User.create({
        email: "test3@test.com",
        firstName: "Bulb",
        lastName: "Toasty",
        pwd: "password1",
        superAdmin: false
    });

    await User.addUserOrganization("test1@test.com", testOrgIds[0], 3);
    await User.addUserOrganization("test2@test.com", testOrgIds[0], 1);
    await User.addUserOrganization("test2@test.com", testOrgIds[1], 2);

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


const bobToken = createToken({email: 'test1@test.com',
                            firstName: 'Bob',
                            lastName: 'Testy',
                            superAdmin: true,
                            organizations: {
                                1: {
                                    orgName: 'Org1',
                                    adminLevel: '3'
                                }
                            }});
const barbToken = createToken({email: 'test2@test.com',
                            firstName: 'Barb',
                            lastName: 'Tasty',
                            superAdmin: false,
                            organizations: {
                                1: {
                                    orgName: 'Org1',
                                    adminLevel: '1'
                                },
                                2: {
                                    orgName: 'Org2',
                                    adminLevel: '2'
                                }
                            }});
const bulbToken = createToken({email: 'test3@test.com',
                            firstName: 'Bulb',
                            lastName: 'Toasty',
                            superAdmin: false,
                            organizations: {
                                null: {
                                    orgName: null,
                                    adminLevel: null
                                }
                            }});

module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testOrgIds,
    testSeasonIds,
    testTeamIds,
    testGameIds,
    bobToken,
    barbToken,
    bulbToken
};