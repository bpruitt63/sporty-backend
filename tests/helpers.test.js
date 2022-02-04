const { createToken, 
    sqlForPartialUpdate, 
    formatUserInfo } = require("../helpers");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

describe("createToken", function () {
    test("works: not superAdmin", function () {
        const token = createToken({ email: 'test@test.com',
                                    firstName: "test", 
                                    lastName: "name",
                                    superAdmin: false,
                                    organizations: {
                                        "1": {
                                          "orgName": "Org1",
                                          "adminLevel": 1
                                        }}});
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            user: {
                email: 'test@test.com',
                firstName: "test",
                lastName: "name",
                superAdmin: false,
                organizations: {
                    "1": {
                    "orgName": "Org1",
                    "adminLevel": 1
                }}
        }});
    });
  
    test("works: superAdmin", function () {
        const token = createToken({ email: 'test@test.com',
                                    firstName: "test", 
                                    lastName: "name",
                                    superAdmin: true,
                                    organizations: {
                                        "1": {
                                          "orgName": "Org1",
                                          "adminLevel": 2
                                        }}});
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            user: {
                email: 'test@test.com',
                firstName: "test",
                lastName: "name",
                superAdmin: true,
                organizations: {
                    "1": {
                    "orgName": "Org1",
                    "adminLevel": 2
                }}
        }});
    });
  
    test("works: default no admin", function () {
        const token = createToken({ email: 'test@test.com', firstName: "test", lastName: "name" });
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            user: {
                email: 'test@test.com',
                firstName: "test",
                lastName: "name",
                superAdmin: false
            }});
    });

    test("works: null organizations", function () {
        const token = createToken({ email: 'test@test.com',
                                    firstName: "test", 
                                    lastName: "name",
                                    superAdmin: false,
                                    organizations: {
                                        null: {
                                          "orgName": null,
                                          "adminLevel": null
                                        }}});
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            user: {
                email: 'test@test.com',
                firstName: "test",
                lastName: "name",
                superAdmin: false,
                organizations: {
                    null: {
                    "orgName": null,
                    "adminLevel": null
                }}
        }});
    });
});


describe("sqlForPartialUpdate", function () {
    test("works: 1 item", function () {
        const result = sqlForPartialUpdate(
            { f1: "v1" },
            { f1: "f1", fF2: "f2" });
        expect(result).toEqual({
            setCols: "\"f1\"=$1",
            values: ["v1"],
        });
    });
  
    test("works: 2 items", function () {
        const result = sqlForPartialUpdate(
            { f1: "v1", jsF2: "v2" },
            { jsF2: "f2" });
        expect(result).toEqual({
            setCols: "\"f1\"=$1, \"f2\"=$2",
            values: ["v1", "v2"],
        });
    });
});


describe("formatUserInfo", function(){
    test("works no orgs", function() {
        const userRows = [{
            email: 'test@test.com',
            firstName: 'test',
            lastName: 'tester',
            superAdmin: false,
            orgId: null,
            orgName: null,
            adminLevel: null
        }];
        const result = formatUserInfo(userRows);
        expect(result).toEqual({
            email: 'test@test.com',
            firstName: 'test',
            lastName: 'tester',
            superAdmin: false,
            organizations: {
                null: {
                    orgName: null,
                    adminLevel: null
                }
            }
        });
    });

    test("works one org", function() {
        const userRows = [{
            email: 'test@test.com',
            firstName: 'test',
            lastName: 'tester',
            superAdmin: false,
            orgId: 1,
            orgName: 'testOrg',
            adminLevel: 2
        }];
        const result = formatUserInfo(userRows);
        expect(result).toEqual({
            email: 'test@test.com',
            firstName: 'test',
            lastName: 'tester',
            superAdmin: false,
            organizations: {
                1: {
                    orgName: 'testOrg',
                    adminLevel: 2
                }
            }
        });
    });

    test("works multiple orgs", function() {
        const userRows = [{
            email: 'test@test.com',
            firstName: 'test',
            lastName: 'tester',
            superAdmin: false,
            orgId: 1,
            orgName: 'testOrg',
            adminLevel: 2
        },
        {
            email: 'test@test.com',
            firstName: 'test',
            lastName: 'tester',
            superAdmin: false,
            orgId: 2,
            orgName: 'testOrg2',
            adminLevel: 1
        }];
        const result = formatUserInfo(userRows);
        expect(result).toEqual({
            email: 'test@test.com',
            firstName: 'test',
            lastName: 'tester',
            superAdmin: false,
            organizations: {
                1: {
                    orgName: 'testOrg',
                    adminLevel: 2
                },
                2: {
                    orgName: 'testOrg2',
                    adminLevel: 1
                }
            }
        });
    });
});