const request = require("supertest");

const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testOrgIds,
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