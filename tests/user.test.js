const {
        NotFoundError,
        BadRequestError,
        UnauthorizedError,
    } = require("../expressError");
const db = require("../db");
const User = require("../models/user");
const {
        commonBeforeAll,
        commonBeforeEach,
        commonAfterEach,
        commonAfterAll,
        testOrgIds,
    } = require("./testCommonModels");
  
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// Login
describe("login", function () {
    test("works", async function () {
        const user = await User.login("test2@test.com", "password");
        expect(user).toEqual([{
            email: "test2@test.com",
            firstName: "Barb",
            lastName: "Tasty",
            superAdmin: false,
            orgId: testOrgIds[0],
            orgName: "Org1",
            adminLevel: 2
        },
        {
            email: "test2@test.com",
            firstName: "Barb",
            lastName: "Tasty",
            superAdmin: false,
            orgId: testOrgIds[1],
            orgName: "Org2",
            adminLevel: 1
        }]);
    });
  
    test("unauth if no such user", async function () {
        try {
            await User.login("nope@nope.com", "password");
            fail();
        } catch (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        }
    });
  
    test("unauth if wrong password", async function () {
        try {
            await User.login("test1@test.com", "wrong");
            fail();
        } catch (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        }
    });
});

// Create
describe("create", function () {
    const newUser = {
        email: "test4@test.com",
        firstName: "Bub",
        lastName: "Tester",
        superAdmin: false,
    };
  
    test("works", async function () {
        let user = await User.create({
            ...newUser,
            pwd: "password",
        });
        expect(user).toEqual(newUser);
        const found = await db.query("SELECT * FROM users WHERE email = 'test4@test.com'");
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].super_admin).toEqual(false);
        expect(found.rows[0].pwd.startsWith("$2b$")).toEqual(true);
    });
  
    test("works: adds super admin", async function () {
        const user = await User.create({
            ...newUser,
            pwd: "password",
            superAdmin: true,
        });
        expect(user).toEqual({ ...newUser, superAdmin: true });
        const found = await db.query("SELECT * FROM users WHERE email = 'test4@test.com'");
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].super_admin).toEqual(true);
        expect(found.rows[0].pwd.startsWith("$2b$")).toEqual(true);
    });
  
    test("bad request with dup data", async function () {
        try {
            await User.create({
            ...newUser,
            pwd: "password",
            });
            await User.create({
            ...newUser,
            pwd: "password",
            });
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

//Get
describe("get", function(){
    test("works", async function(){
        const user = await User.get('test2@test.com');
        expect(user).toEqual(
            [{
                email: "test2@test.com",
                firstName: "Barb",
                lastName: "Tasty",
                superAdmin: false,
                orgId: testOrgIds[0],
                orgName: "Org1",
                adminLevel: 2
            },
            {
                email: "test2@test.com",
                firstName: "Barb",
                lastName: "Tasty",
                superAdmin: false,
                orgId: testOrgIds[1],
                orgName: "Org2",
                adminLevel: 1
            }]);
    });

    test("fails no user", async function(){
        try {
            await User.get("nope@nope.com");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

//Get all
describe("getAll", function(){
    test("works", async function(){
        const users = await User.getAll(testOrgIds[0]);
        expect(users).toEqual([{
            email: "test2@test.com",
            firstName: "Barb",
            lastName: "Tasty",
            superAdmin: false,
            orgId: testOrgIds[0],
            orgName: "Org1",
            adminLevel: 2
        },
        {
            email: "test1@test.com",
            firstName: "Bob",
            lastName: "Testy",
            superAdmin: true,
            orgId: testOrgIds[0],
            orgName: "Org1",
            adminLevel: 3
        }]);
    });

    test("fails no users", async function(){
        try {
            await User.getAll(testOrgIds[2]);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });

    test("fails no organization", async function(){
        try {
            await User.getAll(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        };
    });
});

//Add user organization
describe("add user organization", function(){
    test("works", async function(){
        const userOrg = await User.addUserOrganization('test3@test.com',
                        testOrgIds[2], 2);
        expect(userOrg).toEqual([{
                        email: 'test3@test.com',
                        orgId: testOrgIds[2],
                        firstName: 'Bulb',
                        lastName: 'Toasty',
                        adminLevel: 2,
                        superAdmin: false,
                        orgName: 'Org3'
        }]);
    });
});

//Remove user organization
describe("remove user organization", function(){
    test("works", async function(){
        const userOrg = await User.addUserOrganization('test3@test.com',
                        testOrgIds[2], 2);
        expect(userOrg).toEqual([{
                        email: 'test3@test.com',
                        orgId: testOrgIds[2],
                        firstName: 'Bulb',
                        lastName: 'Toasty',
                        adminLevel: 2,
                        superAdmin: false,
                        orgName: 'Org3'
}]);
        const removed = await User.removeUserOrganization('test3@test.com',
                        testOrgIds[2]);
        expect(removed).toEqual({
                        email: 'test3@test.com',
                        orgId: testOrgIds[2]
        });
    });

    test("error if no such relation", async function(){
        try {
            await User.removeUserOrganization('test3@test.com', testOrgIds[2]);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        };
    });
});

//Update
describe("update", function () {
    const updateData = {
        email: "new@test.com",
        firstName: "NewF",
        lastName: "NewL",
        superAdmin: false
    };
  
    test("works", async function () {
        const user = await User.update("test1@test.com", updateData);
        expect(user).toEqual({
            email: "new@test.com",
            firstName: "NewF",
            lastName: "NewL",
            superAdmin: false
        });
    });
  
    test("works: set password", async function () {
        const user = await User.update("test1@test.com", {
            pwd: "newnew",
        });
        expect(user).toEqual({
            email: "test1@test.com",
            firstName: "Bob",
            lastName: "Testy",
            superAdmin: true
        });
        const found = await db.query("SELECT * FROM users WHERE email = 'test1@test.com'");
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].pwd.startsWith("$2b$")).toEqual(true);
    });
  
    test("not found if no such user", async function () {
        try {
            await User.update("nope", {
            firstName: "test",
            });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
  
    test("bad request if no data", async function () {
        expect.assertions(1);
        try {
            await User.update("test1@test.com", {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        };
    });
});

//Update admin
describe("update admin", function(){
    test("works", async function(){
        const user = await User.updateAdmin('test1@test.com', testOrgIds[0], 1);
        expect(user).toEqual({
            email: 'test1@test.com',
            orgId: testOrgIds[0],
            adminLevel: 1
        });
    });

    test("error if no such relation", async function(){
        try {
            await User.updateAdmin('nope@test.com', -1, 1);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        };
    });
});