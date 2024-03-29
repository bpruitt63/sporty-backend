const request = require("supertest");

const app = require("../app");

const {
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
} = require("./testCommonRoutes");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// GET /:id
describe("GET /organizations/:id", function(){
    test("works", async function() {
        const resp = await request(app)
            .get(`/organizations/${testOrgIds[0]}`);
        expect(resp.body).toEqual({org: {
            orgId: testOrgIds[0],
            orgName: 'Org1'
        }});
    });

    test("not found if no such organization", async function(){
        const resp = await request(app)
            .get('/organizations/-1');
        expect(resp.statusCode).toEqual(404);
    });
});

//GET search
describe("GET /organizations/search/:name", function(){
    test("works", async function(){
        const resp = await request(app)
            .get('/organizations/search/org');
        expect(resp.body).toEqual({orgs: [{
                orgId: testOrgIds[0],
                orgName: 'Org1'
            },
            {
                orgId: testOrgIds[1],
                orgName: 'Org2'
            },
            {
                orgId: testOrgIds[2],
                orgName: 'Org3'
            }]});
    });
});

//POST new org
describe("POST /organizations", function(){
    test("works", async function(){
        const resp = await request(app)
            .post('/organizations')
            .send({orgName: 'newOrg'})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.body).toEqual({org: {
                orgId: expect.any(Number),
                orgName: 'newOrg'
        }});
    });

    test("unauth if not logged in", async function(){
        const resp = await request(app)
            .post('/organizations')
            .send({orgName: 'newName'});
        expect(resp.statusCode).toEqual(401);
    });
});

//PATCH update org
describe("PATCH /organizations/:id", function(){
    test("works", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[1]}`)
            .send({orgName: 'newName'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({org: {
                orgId: testOrgIds[1],
                orgName: 'newName'
        }});
    });

    test("not found if bad orgId", async function(){
        const resp = await request(app)
            .patch('/organizations/-1')
            .send({orgName: 'newName'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("unauth if wrong user", async function(){
        const resp = await request(app)
            .patch('/organizations/-1')
            .send({orgName: 'newName'})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});

//DELETE
describe("DELETE /organizations/:id", function(){
    test("works", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({deleted: `${testOrgIds[0]}`,
                                    token: undefined});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}`)
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});

//POST add teams
describe("POST /organizations/:id/seasons/:seasonId/teams", function(){
    test("works team names", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/teams`)
            .send({teams: [{teamName: 'test1', color: 'red'},
                            {teamName: 'test2', color: 'black'}]})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({teams: 
                                    [{teamId: expect.any(Number),
                                        seasonId: testSeasonIds[0],
                                        teamName: 'test1',
                                        color: 'red'},
                                    {teamId: expect.any(Number),
                                        seasonId: testSeasonIds[0],
                                        teamName: 'test2',
                                        color: 'black'}]});
    });

    test("works team ids", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[1]}/teams`)
            .send({teams: [{teamName: 'test1', color: 'orange'},
                            {teamName: 'test2', color: 'orange'}], 
                            teamIds: [{teamId: testTeamIds[0]}, {teamId: testTeamIds[1]}]})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({teams: 
                                    [{teamId: testTeamIds[0],
                                        seasonId: testSeasonIds[1],
                                        teamName: 'testTeam1',
                                        color: 'red'},
                                    {teamId: testTeamIds[1],
                                        seasonId: testSeasonIds[1],
                                        teamName: 'testTeam2',
                                        color: 'black'}]});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/teams`)
            .send({teams: ['test1', 'test2', 'test3']})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails duplicate team names", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/teams`)
            .send({teams: ['test1', 'test2', 'test2']})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

//GET get all teams from a season
describe("GET /organizations/:id/seasons/:seasonId/teams", function(){
    test("works", async function(){
        const resp = await request(app)
            .get(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/teams`);
        expect(resp.body).toEqual({teams:
                                    [{teamId: testTeamIds[0],
                                        color: 'red',
                                        teamName: 'testTeam1'},
                                    {teamId: testTeamIds[1],
                                        color: 'black',
                                        teamName: 'testTeam2'},
                                    {teamId: testTeamIds[2],
                                        color: 'N/A',
                                        teamName: 'testTeam3'}]})
    });
});

//PATCH update team
describe("PATCH /organizations/:id/seasons/:seasonId/teams/:teamId", function(){
    test("works", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/teams/${testTeamIds[0]}`)
            .send({team: {teamName: 'newName', color: 'orange'}})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({team: {
                                    teamId: testTeamIds[0],
                                    teamName: 'newName',
                                    color: 'orange',
                                    orgId: testOrgIds[0]}})
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/teams/${testTeamIds[0]}`)
            .send({team: {teamName: 'newName', color: 'orange'}})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong organization", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[1]}/seasons/${testSeasonIds[0]}/teams/${testTeamIds[0]}`)
            .send({team: {teamName: 'newName', color: 'orange'}})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });

    test("checks name length", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/teams/${testTeamIds[0]}`)
            .send({team: {teamName: 'n', color: 'orange'}})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

//DELETE team
describe("DELETE /organizations/:id/seasons/:seasonId/teams/:teamId", function(){
    test("works", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/teams/${testTeamIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({deleted: `${testTeamIds[0]}`});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/teams/${testTeamIds[0]}`)
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong organization", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[1]}/seasons/${testSeasonIds[0]}/teams/${testTeamIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });
});

//POST add season
describe("POST /organizations/:id/seasons", function(){
    test("works season", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons`)
            .send({title: 'testSeason'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({season:
                                    {seasonId: expect.any(Number),
                                    seasonTitle: 'testSeason',
                                    orgId: testOrgIds[0],
                                    tournamentFor: null}});
    });

    test("works tournament", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons`)
            .send({title: 'testSeason', tournamentFor: testSeasonIds[0]})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({season:
                                    {seasonId: expect.any(Number),
                                    seasonTitle: 'testSeason',
                                    orgId: testOrgIds[0],
                                    tournamentFor: testSeasonIds[0]}});
    });

    test("sets null bad tournamentFor", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons`)
            .send({title: 'testSeason', tournamentFor: -1})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({season:
                                    {seasonId: expect.any(Number),
                                    seasonTitle: 'testSeason',
                                    orgId: testOrgIds[0],
                                    tournamentFor: null}});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons`)
            .send({title: 'testSeason'})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails no season title", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons`)
            .send({title: ''})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

//GET get all seasons from an organization
describe("GET /organizations/:id/seasons", function(){
    test("works", async function(){
        const resp = await request(app)
            .get(`/organizations/${testOrgIds[0]}/seasons`);
        expect(resp.body).toEqual({seasons:
                                    [{seasonId: testSeasonIds[2],
                                        title: 'testTournament1', 
                                        tournamentFor: null},
                                    {seasonId: testSeasonIds[1],
                                        title: 'testSeason2', 
                                        tournamentFor: null},
                                    {seasonId: testSeasonIds[0],
                                        title: 'testSeason1', 
                                        tournamentFor: null}
                                    ]})
    });
});

//GET single season
describe("GET /organizations/:id/seasons/:seasonId", function(){
    test("works", async function(){
        const resp = await request(app)
            .get(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}`);
        expect(resp.body).toEqual({season:
                                    {seasonId: testSeasonIds[0],
                                        orgId: testOrgIds[0],
                                        title: 'testSeason1',
                                        tournamentFor: null,
                                        seasonTournament: null}})
    });
});

//PATCH update season
describe("PATCH /organizations/:id/seasons/:seasonId", function(){
    test("works", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}`)
            .send({title: 'newName'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({season: {
                                    seasonId: testSeasonIds[0],
                                    title: 'newName',
                                    orgId: testOrgIds[0],
                                    tournamentFor: null}})
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}`)
            .send({title: 'newName'})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong organization", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[1]}/seasons/${testSeasonIds[0]}`)
            .send({title: 'newName'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });

    test("checks name length", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}`)
            .send({title: 'n'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

//DELETE season
describe("DELETE /organizations/:id/seasons/:seasonId", function(){
    test("works", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({deleted: `${testSeasonIds[0]}`});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}`)
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong organization", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[1]}/seasons/${testSeasonIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });
});

//POST add games
describe('POST /organizations/:id/seasons/:seasonId/games', function(){
    test("works all fields", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games`)
            .send({games: [{
                            team1Id: testTeamIds[0],
                            team2Id: testTeamIds[1],
                            gameDate: '2022-12-05',
                            gameTime: '12:00:00',
                            gameLocation: 'testLocation',
                            team1Score: 22,
                            team2Score: 44,
                            notes: 'very exciting'
                        },
                        {
                            team1Id: testTeamIds[1],
                            team2Id: testTeamIds[0],
                            gameDate: '2022-12-07',
                            gameTime: '12:45:00',
                            gameLocation: 'testLocation2',
                            team1Score: 65,
                            team2Score: 49,
                            notes: 'not very exciting'}]})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({games: [{
                            gameId: expect.any(Number),
                            seasonId: testSeasonIds[0],
                            team1Id: testTeamIds[0],
                            team2Id: testTeamIds[1],
                            team1Color: 'red',
                            team1Name: 'testTeam1',
                            team2Color: 'black',
                            team2Name: 'testTeam2',
                            gameDate: '2022-12-05',
                            readableDate: 'Mon 12/05/22',
                            gameTime: '12:00:00',
                            readableTime: '12:00 PM',
                            gameLocation: 'testLocation',
                            team1Score: 22,
                            team2Score: 44,
                            notes: 'very exciting',
                            tournamentRound: null,
                            tournamentGame: null
                        },
                        {
                            gameId: expect.any(Number),
                            seasonId: testSeasonIds[0],
                            team1Id: testTeamIds[1],
                            team2Id: testTeamIds[0],
                            team1Color: 'black',
                            team2Color: 'red',
                            team1Name: 'testTeam2',
                            team2Name: 'testTeam1',
                            gameDate: '2022-12-07',
                            readableDate: 'Wed 12/07/22',
                            gameTime: '12:45:00',
                            readableTime: '12:45 PM',
                            gameLocation: 'testLocation2',
                            team1Score: 65,
                            team2Score: 49,
                            notes: 'not very exciting',
                            tournamentRound: null,
                            tournamentGame: null}]})
    });

    test("works only some fields", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games`)
            .send({games: [{
                            team1Id: testTeamIds[0],
                            team2Id: testTeamIds[1],
                            gameDate: null,
                            gameTime: null,
                            gameLocation: '',
                            team1Score: null,
                            team2Score: null,
                            notes: ''
                        },
                        {
                            team1Id: testTeamIds[1],
                            team2Id: testTeamIds[0],
                            gameDate: '2022-12-07',
                            gameTime: '12:45:00',
                            gameLocation: '',
                            team1Score: null,
                            team2Score: null,
                            notes: ''}]})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({games: [{
                            gameId: expect.any(Number),
                            seasonId: testSeasonIds[0],
                            team1Id: testTeamIds[0],
                            team2Id: testTeamIds[1],
                            team1Color: 'red',
                            team2Color: 'black',
                            team1Name: 'testTeam1',
                            team2Name: 'testTeam2',
                            gameDate: null,
                            readableDate: null,
                            gameTime: null,
                            readableTime: null,
                            gameLocation: '',
                            team1Score: null,
                            team2Score: null,
                            notes: '',
                            tournamentRound: null,
                            tournamentGame: null
                        },
                        {
                            gameId: expect.any(Number),
                            seasonId: testSeasonIds[0],
                            team1Id: testTeamIds[1],
                            team2Id: testTeamIds[0],
                            team2Color: 'red',
                            team1Color: 'black',
                            team2Name: 'testTeam1',
                            team1Name: 'testTeam2',
                            gameDate: '2022-12-07',
                            readableDate: 'Wed 12/07/22',
                            gameTime: '12:45:00',
                            readableTime: '12:45 PM',
                            gameLocation: '',
                            team1Score: null,
                            team2Score: null,
                            notes: '',
                            tournamentRound: null,
                            tournamentGame: null}]})
    });

    test("works tournament", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[2]}/games`)
            .send({games: {
                'Round 1': {
                    'Game 1': {
                        team1Id: testTeamIds[0],
                        team2Id: testTeamIds[1],
                        team1Color: 'N/A',
                        team2Color: 'N/A',
                        team1Name: 'testTeam1',
                        team2Name: 'testTeam2'
                    },
                    'Game 2': {
                        team1Id: testTeamIds[2],
                        team2Id: testTeamIds[3],
                        team1Color: 'N/A',
                        team2Color: 'N/A',
                        team1Name: 'testTeam3',
                        team2Name: 'testTeam4'
                    }
                },
                'Round 2': {
                    'Game 1': {
                        team1Id: null,
                        team2Id: null,
                        team1Color: 'N/A',
                        team2Color: 'N/A',
                        team1Name: 'N/A',
                        team2Name: 'N/A'
                    },
                    'Game 2': {
                        team1Id: null,
                        team2Id: null,
                        team1Color: 'N/A',
                        team2Color: 'N/A',
                        team1Name: 'N/A',
                        team2Name: 'N/A'
                    }
                }
            }})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({games: {
            'Round 1': {
                'Game 1': {
                    gameId: expect.any(Number),
                    seasonId: testSeasonIds[2],
                    team1Id: testTeamIds[0],
                    team2Id: testTeamIds[1],
                    team1Color: 'red',
                    team2Color: 'black',
                    team1Name: 'testTeam1',
                    team2Name: 'testTeam2',
                    gameDate: null,
                    gameTime: null,
                    readableDate: null,
                    readableTime: null,
                    gameLocation: null,
                    team1Score: null,
                    team2Score: null,
                    notes: null,
                    tournamentRound: 1,
                    tournamentGame: 1
                },
                'Game 2': {
                    gameId: expect.any(Number),
                    seasonId: testSeasonIds[2],
                    team1Id: testTeamIds[2],
                    team2Id: testTeamIds[3],
                    team1Color: 'N/A',
                    team2Color: 'N/A',
                    team1Name: 'testTeam3',
                    team2Name: 'testTeam4',
                    gameDate: null,
                    gameTime: null,
                    readableDate: null,
                    readableTime: null,
                    gameLocation: null,
                    team1Score: null,
                    team2Score: null,
                    notes: null,
                    tournamentRound: 1,
                    tournamentGame: 2
                }
            },
            'Round 2': {
                'Game 1': {
                    gameId: expect.any(Number),
                    seasonId: testSeasonIds[2],
                    team1Id: null,
                    team2Id: null,
                    team1Color: null,
                    team2Color: null,
                    team1Name: null,
                    team2Name: null,
                    gameDate: null,
                    gameTime: null,
                    readableDate: null,
                    readableTime: null,
                    gameLocation: null,
                    team1Score: null,
                    team2Score: null,
                    notes: null,
                    tournamentRound: 2,
                    tournamentGame: 1
                },
                'Game 2': {
                    gameId: expect.any(Number),
                    seasonId: testSeasonIds[2],
                    team1Id: null,
                    team2Id: null,
                    team1Color: null,
                    team2Color: null,
                    team1Name: null,
                    team2Name: null,
                    gameDate: null,
                    gameTime: null,
                    readableDate: null,
                    readableTime: null,
                    gameLocation: null,
                    team1Score: null,
                    team2Score: null,
                    notes: null,
                    tournamentRound: 2,
                    tournamentGame: 2
                }
            }
        }})
    });

    test("won't add tournament games to season that already has games", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games`)
            .send({games: {
                'Round 1': {
                    'Game 1': {
                        team1Id: testTeamIds[0],
                        team2Id: testTeamIds[1],
                        team1Color: 'N/A',
                        team2Color: 'N/A',
                        team1Name: 'testTeam1',
                        team2Name: 'testTeam2'
                    },
                    'Game 2': {
                        team1Id: testTeamIds[2],
                        team2Id: testTeamIds[3],
                        team1Color: 'N/A',
                        team2Color: 'N/A',
                        team1Name: 'testTeam3',
                        team2Name: 'testTeam4'
                    }
                },
                'Round 2': {
                    'Game 1': {
                        team1Id: null,
                        team2Id: null,
                        team1Color: 'N/A',
                        team2Color: 'N/A',
                        team1Name: 'N/A',
                        team2Name: 'N/A'
                    },
                    'Game 2': {
                        team1Id: null,
                        team2Id: null,
                        team1Color: 'N/A',
                        team2Color: 'N/A',
                        team1Name: 'N/A',
                        team2Name: 'N/A'
                    }
                }
            }})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games`)
            .send({games: [{
                            team1Id: testTeamIds[0],
                            team2Id: testTeamIds[1],
                            gameDate: null,
                            gameTime: null,
                            gameLocation: '',
                            team1Score: null,
                            team2Score: null,
                            notes: ''
                        },
                        {
                            team1Id: testTeamIds[1],
                            team2Id: testTeamIds[0],
                            gameDate: '2022-12-07',
                            gameTime: '12:45:00',
                            gameLocation: '',
                            team1Score: null,
                            team2Score: null,
                            notes: ''}]})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong org", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[1]}/seasons/${testSeasonIds[0]}/games`)
            .send({games: [{
                            team1Id: testTeamIds[0],
                            team2Id: testTeamIds[1],
                            gameDate: null,
                            gameTime: null,
                            gameLocation: '',
                            team1Score: null,
                            team2Score: null,
                            notes: ''
                        },
                        {
                            team1Id: testTeamIds[1],
                            team2Id: testTeamIds[0],
                            gameDate: 'Wed 12/07/22',
                            gameTime: '12:45:00',
                            gameLocation: '',
                            team1Score: null,
                            team2Score: null,
                            notes: ''}]})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });
});

//GET get all games from season/team
describe("GET /organizations/:id/seasons/:seasonId/games", function(){
    test("works seasonId", async function(){
        const resp = await request(app)
            .get(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games`);
        expect(resp.body).toEqual({games: [{
                                gameId: testGameIds[0],
                                team1Id: testTeamIds[0],
                                team2Id: testTeamIds[1],
                                seasonId: testSeasonIds[0],
                                title: 'testSeason1',
                                readableDate: 'Sun 12/12/21',
                                gameDate: '2021-12-12',
                                gameTime: '12:00:00',
                                readableTime: '12:00 PM',
                                gameLocation: 'testLocation',
                                team1Score: 21,
                                team2Score: 22,
                                notes: 'frightening',
                                team1Name: 'testTeam1',
                                team1Color: 'red',
                                team2Name: 'testTeam2',
                                team2Color: 'black',
                                tournamentRound: null,
                                tournamentGame: null
                            },
                            {
                                gameId: testGameIds[1],
                                team1Id: testTeamIds[1],
                                team2Id: testTeamIds[0],
                                seasonId: testSeasonIds[0],
                                title: 'testSeason1',
                                readableDate: null,
                                gameDate: null,
                                gameTime: null,
                                readableTime: null,
                                gameLocation: '',
                                team1Score: null,
                                team2Score: null,
                                notes: '',
                                team1Name: 'testTeam2',
                                team1Color: 'black',
                                team2Name: 'testTeam1',
                                team2Color: 'red',
                                tournamentRound: null,
                                tournamentGame: null
                            },
                            {
                                gameId: testGameIds[2],
                                team1Id: testTeamIds[1],
                                team2Id: testTeamIds[2],
                                seasonId: testSeasonIds[0],
                                title: 'testSeason1',
                                readableDate: null,
                                gameDate: null,
                                gameTime: null,
                                readableTime: null,
                                gameLocation: '',
                                team1Score: null,
                                team2Score: null,
                                notes: '',
                                team1Name: 'testTeam2',
                                team1Color: 'black',
                                team2Name: 'testTeam3',
                                team2Color: 'N/A',
                                tournamentRound: null,
                                tournamentGame: null
                            }]});
    });

    test("works teamId", async function(){
        const resp = await request(app)
            .get(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games`)
            .send({teamId: testTeamIds[0]});
        expect(resp.body).toEqual({games: [{
                                gameId: testGameIds[0],
                                team1Id: testTeamIds[0],
                                team2Id: testTeamIds[1],
                                seasonId: testSeasonIds[0],
                                title: 'testSeason1',
                                gameDate: '2021-12-12',
                                readableDate: 'Sun 12/12/21',
                                gameTime: '12:00:00',
                                readableTime: '12:00 PM',
                                gameLocation: 'testLocation',
                                team1Score: 21,
                                team2Score: 22,
                                notes: 'frightening',
                                team1Name: 'testTeam1',
                                team1Color: 'red',
                                team2Name: 'testTeam2',
                                team2Color: 'black',
                                tournamentRound: null,
                                tournamentGame: null
                            },
                            {
                                gameId: testGameIds[1],
                                team1Id: testTeamIds[1],
                                team2Id: testTeamIds[0],
                                seasonId: testSeasonIds[0],
                                title: 'testSeason1',
                                readableDate: null,
                                gameDate: null,
                                gameTime: null,
                                readableTime: null,
                                gameLocation: '',
                                team1Score: null,
                                team2Score: null,
                                notes: '',
                                team1Name: 'testTeam2',
                                team1Color: 'black',
                                team2Name: 'testTeam1',
                                team2Color: 'red',
                                tournamentRound: null,
                                tournamentGame: null
                            }]});
    });
});

//PATCH update game
describe("PATCH /organizations/:id/seasons/:seasonId/games/:gameId", function(){
    test("works", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games/${testGameIds[0]}`)
            .send({game: {
                team1Id: testTeamIds[1],
                team2Id: testTeamIds[0],
                gameDate: '2022-12-05',
                gameTime: '12:00:00',
                team1Score: 22,
                team2Score: 44,
                notes: ''
            }})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({game: {
                                    gameId: testGameIds[0],
                                    seasonId: testSeasonIds[0],
                                    team1Id: testTeamIds[1],
                                    team2Id: testTeamIds[0],
                                    gameDate: '2022-12-05',
                                    readableDate: 'Mon 12/05/22',
                                    gameTime: '12:00:00',
                                    readableTime: '12:00 PM',
                                    gameLocation: 'testLocation',
                                    team1Score: 22,
                                    team2Score: 44,
                                    notes: '',
                                    team1Name: 'testTeam2',
                                    team2Name: 'testTeam1',
                                    team1Color: 'black',
                                    team2Color: 'red',
                                    tournamentRound: null,
                                    tournamentGame: null
                                }});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games/${testGameIds[0]}`)
            .send({game: {
                team1Id: testTeamIds[1],
                team2Id: testTeamIds[0],
                gameDate: '2022-12-05',
                gameTime: '12:00:00',
                team1Score: 22,
                team2Score: 44,
                notes: ''
            }})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong org", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[1]}/seasons/${testSeasonIds[0]}/games/${testGameIds[0]}`)
            .send({game: {
                team1Id: testTeamIds[1],
                team2Id: testTeamIds[0],
                gameDate: '2022-12-05',
                gameTime: '12:00:00',
                team1Score: 22,
                team2Score: 44,
                notes: ''
            }})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });

    test('works from GameCP', async function() {
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games/${testGameIds[1]}`)
            .send({game: {
                team1Score: 22,
                team2Score: 44,
                source: 'GameCP'
            }})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({game: {
                                    gameId: testGameIds[1],
                                    seasonId: testSeasonIds[0],
                                    team1Id: testTeamIds[1],
                                    team2Id: testTeamIds[0],
                                    gameDate: null,
                                    readableDate: null,
                                    gameTime: null,
                                    readableTime: null,
                                    gameLocation: '',
                                    team1Score: 22,
                                    team2Score: 44,
                                    notes: '',
                                    team1Name: 'testTeam2',
                                    team2Name: 'testTeam1',
                                    team1Color: 'black',
                                    team2Color: 'red',
                                    tournamentRound: null,
                                    tournamentGame: null
                                }});
    });
});

//DELETE game
describe("DELETE /organizations/:id/seasons/:seasonId/games/:gameId", function(){
    test("works", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games/${testGameIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({deleted: `${testGameIds[0]}`});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/seasons/${testSeasonIds[0]}/games/${testGameIds[0]}`)
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong organization", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[1]}/seasons/${testSeasonIds[0]}/games/${testGameIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });
});