const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");
const db = require("../db");
const Organization = require("../models/organization");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testOrgIds,
    testTeamIds,
    testSeasonIds,
    testGameIds
} = require("./testCommonModels");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

//Get
describe("get", function(){
    test("works", async function(){
        const org = await Organization.get(testOrgIds[0]);
        expect(org).toEqual({
            orgId: testOrgIds[0],
            orgName: 'Org1'
        });
    });

    test("error if no organization", async function(){
        try{
            await Organization.get(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Search
describe("search", function(){
    test("works", async function(){
        const orgs = await Organization.search('org1');
        expect(orgs).toEqual([{
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
            },
            {
                orgId: testOrgIds[3],
                orgName: 'TestOrg1'
            }]);
    });

    test("orders by similarity", async function(){
        const orgs = await Organization.search('org2');
        expect(orgs).toEqual([{
                orgId: testOrgIds[1],
                orgName: 'Org2'
            },
            {
                orgId: testOrgIds[0],
                orgName: 'Org1'
            },
            {
                orgId: testOrgIds[2],
                orgName: 'Org3'
            }]);
    });
});

//Add
describe("add", function(){
    test("works", async function(){
        const org = await Organization.add('newOrg');
        expect(org).toEqual({
            orgId: expect.any(Number),
            orgName: 'newOrg'
        });
    });
});

//Update
describe("update", function(){
    test("works", async function(){
        const org = await Organization.update(testOrgIds[0], 'newName');
        expect(org).toEqual({
            orgId: expect.any(Number),
            orgName: 'newName'
        });
    });

    test("not found if no such org", async function () {
        try {
            await Organization.update(-1, 'newName');
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Remove
describe("remove", function(){
    test("works", async function(){
        const res = await Organization.remove(testOrgIds[0]);
        expect(res).toEqual(undefined);
    });

    test("fails if no such org", async function(){
        try{
            await Organization.remove(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Add teams
describe("addTeams", function(){
    test("works", async function(){
        const teams = await Organization.addTeams(['test1', 'test2', 'test3'], testSeasonIds[0]);
        expect(teams).toEqual([{teamId: expect.any(Number),
                                teamName: 'test1',
                                seasonId: testSeasonIds[0]},
                            {teamId: expect.any(Number),
                                teamName: 'test2',
                                seasonId: testSeasonIds[0]},
                            {teamId: expect.any(Number),
                                teamName: 'test3',
                                seasonId: testSeasonIds[0]}]);
    });

    test("fails no data", async function(){
        try{
            await Organization.addTeams([]);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        };
    });
});

//Get all teams from a season
describe("getTeams", function(){
    test("works", async function(){
        const teams = await Organization.getTeams(testSeasonIds[0]);
        expect(teams).toEqual([{teamId: testTeamIds[0],
                                    teamName: 'testTeam1'},
                                {teamId: testTeamIds[1],
                                    teamName: 'testTeam2'}])
    });

    test("fails no teams", async function(){
        try{
            await Organization.getTeams(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
});

//Get single team basic info
describe("getTeam", function(){
    test("works", async function(){
        const team = await Organization.getTeam(testTeamIds[0]);
        expect(team).toEqual({teamId: testTeamIds[0],
                                teamName: 'testTeam1',
                                seasonId: testSeasonIds[0],
                                orgId: testOrgIds[0]});
    });

    test("fails no team", async function(){
        try{
            await Organization.getTeam(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Update team
describe("updateTeam", function(){
    test("works", async function(){
        const team = await Organization.updateTeam(testTeamIds[0], 'newName');
        expect(team).toEqual({teamId: testTeamIds[0],
                                teamName: 'newName',
                                seasonId: testSeasonIds[0]});
    });

    test("fails no such team", async function(){
        try{
            await Organization.updateTeam(-1, 'newName');
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Delete team
describe("removeTeam", function(){
    test("works", async function(){
        const res = await Organization.removeTeam(testTeamIds[0]);
        expect(res).toEqual(undefined);
    });

    test("fails if no such team", async function(){
        try{
            await Organization.removeTeam(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Add season
describe("addSeason", function(){
    test("works", async function(){
        const season = await Organization.addSeason('testSeason', testOrgIds[0]);
        expect(season).toEqual({seasonId: expect.any(Number),
                                seasonTitle: 'testSeason',
                                orgId: testOrgIds[0]});
    });
});

//Get all seasons from an organization
describe("getSeasons", function(){
    test("works", async function(){
        const seasons = await Organization.getSeasons(testOrgIds[0]);
        expect(seasons).toEqual([{seasonId: testSeasonIds[0],
                                    title: 'testSeason1'},
                                {seasonId: testSeasonIds[1],
                                    title: 'testSeason2'}])
    });

    test("fails no seasons", async function(){
        try{
            await Organization.getSeasons(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
});

//Get single season basic info
describe("getSeason", function(){
    test("works", async function(){
        const season = await Organization.getSeason(testSeasonIds[0]);
        expect(season).toEqual({seasonId: testSeasonIds[0],
                                title: 'testSeason1',
                                orgId: testOrgIds[0]});
    });

    test("fails no season", async function(){
        try{
            await Organization.getSeason(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Update season
describe("updateSeason", function(){
    test("works", async function(){
        const season = await Organization.updateSeason(testSeasonIds[0], 'newName');
        expect(season).toEqual({seasonId: testSeasonIds[0],
                                title: 'newName',
                                orgId: testOrgIds[0]});
    });

    test("fails no such season", async function(){
        try{
            await Organization.updateSeason(-1, 'newName');
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Delete season
describe("removeSeason", function(){
    test("works", async function(){
        const res = await Organization.removeSeason(testSeasonIds[0]);
        expect(res).toEqual(undefined);
    });

    test("fails if no such season", async function(){
        try{
            await Organization.removeSeason(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Add games
describe("addGames", function(){
    test("works", async function(){
        const res = await Organization.addGames(testSeasonIds[0], 
                                [{
                                    team1Id: testTeamIds[1],
                                    team2Id: testTeamIds[0],
                                    gameDate: '12/2/21',
                                    gameTime: '1:00 pm',
                                    gameLocation: 'testLocation',
                                    team1Score: 42,
                                    team2Score: 21,
                                    notes: 'what a test'
                                },
                                {
                                    team1Id: testTeamIds[0],
                                    team2Id: testTeamIds[1],
                                    gameDate: '12/3/21',
                                    gameTime: '02:00 pm',
                                    gameLocation: 'testLocation2',
                                    team1Score: 55,
                                    team2Score: 77,
                                    notes: 'not a test'
                                }]);
        expect(res).toEqual([{
                                    gameId: expect.any(Number),
                                    seasonId: testSeasonIds[0],
                                    team1Id: testTeamIds[1],
                                    team2Id: testTeamIds[0],
                                    gameDate: '12/2/21',
                                    gameTime: '1:00 pm',
                                    gameLocation: 'testLocation',
                                    team1Score: 42,
                                    team2Score: 21,
                                    notes: 'what a test'
                                },
                                {
                                    gameId: expect.any(Number),
                                    seasonId: testSeasonIds[0],
                                    team1Id: testTeamIds[0],
                                    team2Id: testTeamIds[1],
                                    gameDate: '12/3/21',
                                    gameTime: '02:00 pm',
                                    gameLocation: 'testLocation2',
                                    team1Score: 55,
                                    team2Score: 77,
                                    notes: 'not a test'
                                }]);
    });
});

//Get game organization
describe("getGameOrganization", function(){
    test("works", async function(){
        const res = await Organization.getGameOrganization(testGameIds[0]);
        expect(res).toEqual({orgId: testOrgIds[0]});
    });

    test("fails no such game", async function(){
        try {
            await Organization.getGameOrganization(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Update game
describe("updateGame", function(){
    test("works", async function(){
        const res = await Organization.updateGame(testGameIds[0], {gameLocation: 'elsewhere', notes: 'not wow'});
    expect(res).toEqual({
                        gameId: testGameIds[0],
                        seasonId: testSeasonIds[0],
                        team1Id: testTeamIds[0],
                        team2Id: testTeamIds[1],
                        gameDate: '12/12/21',
                        gameTime: '12:00 pm',
                        gameLocation: 'elsewhere',
                        team1Score: 21,
                        team2Score: 22,
                        notes: 'not wow',
                        team1Name: 'testTeam1',
                        team2Name: 'testTeam2'
                    })
    });

    test("fails no such game", async function(){
        try{
            await Organization.updateGame(-1, {notes: 'more notes'});
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
});