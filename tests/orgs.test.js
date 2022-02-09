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
        expect(resp.body).toEqual({deleted: `${testOrgIds[0]}`});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}`)
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});

//POST add teams
describe("POST /organizations/:id/:seasonId/teams", function(){
    test("works", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/${testSeasonIds[0]}/teams`)
            .send({teams: ['test1', 'test2', 'test3']})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({teams: 
                                    [{teamId: expect.any(Number),
                                        teamName: 'test1',
                                        seasonId: testSeasonIds[0]},
                                    {teamId: expect.any(Number),
                                        teamName: 'test2',
                                        seasonId: testSeasonIds[0]},
                                    {teamId: expect.any(Number),
                                        teamName: 'test3',
                                        seasonId: testSeasonIds[0]}]});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/${testSeasonIds[0]}/teams`)
            .send({teams: ['test1', 'test2', 'test3']})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails duplicate team names", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/${testSeasonIds[0]}/teams`)
            .send({teams: ['test1', 'test2', 'test2']})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

//GET get all teams from a season
describe("GET /organizations/:id/:seasonId/teams", function(){
    test("works", async function(){
        const resp = await request(app)
            .get(`/organizations/${testOrgIds[0]}/${testSeasonIds[0]}/teams`);
        expect(resp.body).toEqual({teams:
                                    [{teamId: testTeamIds[0],
                                        teamName: 'testTeam1'},
                                    {teamId: testTeamIds[1],
                                        teamName: 'testTeam2'}]})
    });
});

//PATCH update team
describe("PATCH /organizations/:id/:seasonId/:teamId", function(){
    test("works", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/${testSeasonIds[0]}/${testTeamIds[0]}`)
            .send({team: 'newName'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({team: {
                                    teamId: testTeamIds[0],
                                    teamName: 'newName',
                                    seasonId: testSeasonIds[0]}})
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/${testSeasonIds[0]}/${testTeamIds[0]}`)
            .send({team: 'newName'})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong organization", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[1]}/${testSeasonIds[0]}/${testTeamIds[0]}`)
            .send({team: 'newName'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });

    test("checks name length", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/${testSeasonIds[0]}/${testTeamIds[0]}`)
            .send({team: 'n'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

//DELETE team
describe("DELETE /organizations/:id/:seasonId/:teamId", function(){
    test("works", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/${testSeasonIds[0]}/${testTeamIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({deleted: `${testTeamIds[0]}`});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/${testSeasonIds[0]}/${testTeamIds[0]}`)
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong organization", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[1]}/${testSeasonIds[0]}/${testTeamIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });
});

//POST add season
describe("POST /organizations/:id/seasons", function(){
    test("works", async function(){
        const resp = await request(app)
            .post(`/organizations/${testOrgIds[0]}/seasons`)
            .send({title: 'testSeason'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({season:
                                    {seasonId: expect.any(Number),
                                    seasonTitle: 'testSeason',
                                    orgId: testOrgIds[0]}});
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
                                    [{seasonId: testSeasonIds[0],
                                        title: 'testSeason1'},
                                    {seasonId: testSeasonIds[1],
                                        title: 'testSeason2'}]})
    });
});

//PATCH update season
describe("PATCH /organizations/:id/season:seasonId", function(){
    test("works", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/season${testSeasonIds[0]}`)
            .send({title: 'newName'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({season: {
                                    seasonId: testSeasonIds[0],
                                    title: 'newName',
                                    orgId: testOrgIds[0]}})
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/season${testSeasonIds[0]}`)
            .send({title: 'newName'})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong organization", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[1]}/season${testSeasonIds[0]}`)
            .send({title: 'newName'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });

    test("checks name length", async function(){
        const resp = await request(app)
            .patch(`/organizations/${testOrgIds[0]}/season${testSeasonIds[0]}`)
            .send({title: 'n'})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

//DELETE season
describe("DELETE /organizations/:id/season:seasonId", function(){
    test("works", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/season${testSeasonIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({deleted: `${testSeasonIds[0]}`});
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[0]}/season${testSeasonIds[0]}`)
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails wrong organization", async function(){
        const resp = await request(app)
            .delete(`/organizations/${testOrgIds[1]}/season${testSeasonIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(403);
    });
});