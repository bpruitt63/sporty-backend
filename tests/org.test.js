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