const request = require("supertest");

const db = require("../db");
const app = require("../app");
const User = require("../models/user");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testOrgIds,
    bobToken,
    barbToken,
    bulbToken,
} = require("./testCommonRoutes");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// POST /users/login
describe("POST /users/login", function () {
    test("works", async function () {
        const resp = await request(app)
            .post("/users/login")
            .send({
                email: "test1@test.com",
                pwd: "password1",
            });
        expect(resp.body).toEqual({
            "token": expect.any(String)
        });
    });
  
    test("unauth with non-existent user", async function () {
        const resp = await request(app)
            .post("/users/login")
            .send({
                email: "nope@nope.com",
                pwd: "password1",
            });
        expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth with wrong password", async function () {
        const resp = await request(app)
            .post("/users/login")
            .send({
                email: "test1@test.com",
                pwd: "nopers",
            });
        expect(resp.statusCode).toEqual(401);
    });
  
    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/users/login")
            .send({
                email: "test1@test.com",
            });
        expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/users/login")
            .send({
                username: 42,
                pwd: "above-is-a-number",
            });
        expect(resp.statusCode).toEqual(400);
    });
});

describe("POST /register", function(){
    test("works", async function(){
        const resp = await request(app)
            .post('/users/register')
            .send({
                email: 'new@test.com',
                pwd: 'password',
                firstName: 'New',
                lastName: 'Name'
            });
        expect(resp.body).toEqual({
            "token": expect.any(String)
        });
    });

    test("fails dupe", async function(){
        const resp = await request(app)
            .post('/users/register')
            .send({
                email: 'test1@test.com',
                pwd: 'password',
                firstName: 'New',
                lastName: 'Name'
            });
        expect(resp.statusCode).toEqual(400);
    });
});

describe("POST /create", function(){
    test("works", async function(){
        const resp = await request(app)
            .post('/users/create')
            .send({
                email: 'new@test.com',
                pwd: 'password',
                firstName: 'New',
                lastName: 'Name',
                superAdmin: false
            })
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({
                email: 'new@test.com',
                firstName: 'New',
                lastName: 'Name',
                superAdmin: false
        });
    });

    test("works, create super admin", async function(){
        const resp = await request(app)
            .post('/users/create')
            .send({
                email: 'new@test.com',
                pwd: 'password',
                firstName: 'New',
                lastName: 'Name',
                superAdmin: true
            })
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({
                email: 'new@test.com',
                firstName: 'New',
                lastName: 'Name',
                superAdmin: true
        });
    });

    test("fails dupe", async function(){
        const resp = await request(app)
            .post('/users/create')
            .send({
                email: 'test1@test.com',
                pwd: 'password',
                firstName: 'New',
                lastName: 'Name',
                superAdmin: false
            })
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("fails unauth", async function(){
        const resp = await request(app)
            .post('/users/create')
            .send({
                email: 'new@test.com',
                pwd: 'password',
                firstName: 'New',
                lastName: 'Name',
                superAdmin: false
            });
        expect(resp.statusCode).toEqual(401);
    });
});

describe("PATCH /users/:email", function() {
    test("works for admins", async function () {
        const resp = await request(app)
            .patch(`/users/test3@test.com`)
            .send({
                firstName: "New"
            })
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({
            email: "test3@test.com",
            firstName: "New",
            lastName: "Toasty",
            superAdmin: false
        });
    });
  
    test("works for same user", async function () {
        const resp = await request(app)
            .patch(`/users/test3@test.com`)
            .send({
                firstName: "New"
            })
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.body).toEqual({
                email: "test3@test.com",
                firstName: "New",
                lastName: "Toasty",
                superAdmin: false
        });
    });
  
    test("unauth if not same user", async function () {
        const resp = await request(app)
            .patch(`/users/test2@test.com`)
            .send({
                firstName: "New"
            })
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
        });
    
    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/users/test2@test.com`)
            .send({
                firstName: "New",
            });
        expect(resp.statusCode).toEqual(401);
    });
  
    test("not found if no such user", async function () {
        const resp = await request(app)
            .patch(`/users/test3524356@test.com`)
            .send({
                firstName: "Nope",
            })
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(404);
    });
  
    test("bad request if invalid data", async function () {
        const resp = await request(app)
            .patch(`/users/test2@test.com`)
            .send({
                firstName: 42,
            })
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.statusCode).toEqual(400);
    });
  
    test("works: can set new password", async function () {
        const resp = await request(app)
            .patch(`/users/test1@test.com`)
            .send({
                pwd: "new-password",
            })
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({
                email: "test1@test.com",
                firstName: "Bob",
                lastName: "Testy",
                superAdmin: true
        });
        const isSuccessful = await User.login("test1@test.com", "new-password");
        expect(isSuccessful).toBeTruthy();
    });

    test("super admin can update super admin", async function () {
        const resp = await request(app)
            .patch(`/users/test3@test.com`)
            .send({
                superAdmin: true
            })
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({
                email: "test3@test.com",
                firstName: "Bulb",
                lastName: "Toasty",
                superAdmin: true
        });
    });

    test("regular user can't update super admin", async function () {
        const resp = await request(app)
            .patch(`/users/test3@test.com`)
            .send({
                firstName: "New",
                superAdmin: true
            })
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});

describe("GET /:email", function() {
    test("works super admin", async function(){
        const resp = await request(app)
            .get(`/users/test2@test.com`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({user: {
                email: "test2@test.com",
                firstName: "Barb",
                lastName: "Tasty",
                superAdmin: false,
                organizations: {
                    [testOrgIds[0]]: {
                        orgName: "Org1",
                        adminLevel: 1
                    },
                    [testOrgIds[1]]: {
                        orgName: "Org2",
                        adminLevel: 2
                    }
                }}});
    });

    test("works same user", async function(){
        const resp = await request(app)
            .get(`/users/test2@test.com`)
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.body).toEqual({user: {
                email: "test2@test.com",
                firstName: "Barb",
                lastName: "Tasty",
                superAdmin: false,
                organizations: {
                    [testOrgIds[0]]: {
                        orgName: "Org1",
                        adminLevel: 1
                    },
                    [testOrgIds[1]]: {
                        orgName: "Org2",
                        adminLevel: 2
                    }
                }}});
    });

    test("unauth not admin/ wrong user", async function(){
        const resp = await request(app)
            .get(`/users/test2@test.com`)
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});

describe("GET /org/:id", function() {
    test("works", async function(){
        const resp = await request(app)
            .get(`/users/org/${testOrgIds[0]}`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({users: [ 
            {
                email: "test2@test.com",
                firstName: "Barb",
                lastName: "Tasty",
                superAdmin: false,
                organizations: {
                    [testOrgIds[0]]: {
                        orgName: "Org1",
                        adminLevel: 1
                    }}
            },
            {
                email: "test1@test.com",
                firstName: "Bob",
                lastName: "Testy",
                superAdmin: true,
                organizations: {
                    [testOrgIds[0]]: {
                        orgName: "Org1",
                        adminLevel: 3
                    }}
            }
        ]});
    });

    test("unauth not admin", async function(){
        const resp = await request(app)
            .get(`/users/org/${testOrgIds[0]}`)
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});

describe("POST, /org:id/:email", function(){
    test("works", async function(){
        const resp = await request(app)
            .post(`/users/org${testOrgIds[0]}/test3@test.com`)
            .send({adminLevel: 1})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({userOrg: {
                email: 'test3@test.com',
                orgId: testOrgIds[0],
                adminLevel: 1
        }});
    });

    test("non admin can't give admin level", async function(){
        const resp = await request(app)
            .post(`/users/org${testOrgIds[0]}/test3@test.com`)
            .send({adminLevel: 1})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.body).toEqual({userOrg: {
                email: 'test3@test.com',
                orgId: testOrgIds[0],
                adminLevel: 3
        }});
    });
});

describe("DELETE, /org:id/:email", function(){
    test("works, admin", async function(){
        const resp = await request(app)
            .delete(`/users/org${testOrgIds[0]}/test2@test.com`)
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({userOrg: {
                email: 'test2@test.com',
                orgId: testOrgIds[0]
        }});
    });

    test("works, self", async function(){
        const resp = await request(app)
            .delete(`/users/org${testOrgIds[0]}/test2@test.com`)
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.body).toEqual({userOrg: {
                email: 'test2@test.com',
                orgId: testOrgIds[0]
        }});
    });

    test("unauth, wrong user/non admin", async function(){
        const resp = await request(app)
            .delete(`/users/org${testOrgIds[0]}/test2@test.com`)
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});

describe("PATCH, /org:id/:email", function(){
    test("works", async function(){
        const resp = await request(app)
            .patch(`/users/org${testOrgIds[0]}/test2@test.com`)
            .send({adminLevel: 1})
            .set("authorization", `Bearer ${bobToken}`);
        expect(resp.body).toEqual({
                    email: 'test2@test.com',
                    orgId: testOrgIds[0],
                    adminLevel: 1
        });
    });

    test("unauth non admin", async function(){
        const resp = await request(app)
            .patch(`/users/org${testOrgIds[0]}/test2@test.com`)
            .send({adminLevel: 1})
            .set("authorization", `Bearer ${bulbToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth self", async function(){
        const resp = await request(app)
            .patch(`/users/org${testOrgIds[0]}/test2@test.com`)
            .send({adminLevel: 1})
            .set("authorization", `Bearer ${barbToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});