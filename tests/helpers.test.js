const { createToken, 
    sqlForPartialUpdate, 
    formatUserInfo,
    sqlForVariableArraySize,
    sqlForObjectArray } = require("../helpers");
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


describe("sqlForVariableArraySize", function () {
    test("works: 1 item", function () {
        const result = sqlForVariableArraySize(['item']);
        expect(result).toEqual('($1, $2)');
    });
  
    test("works: multiple items", function () {
        const result = sqlForVariableArraySize(['item1', 'item2', 'item3']);
        expect(result).toEqual('($1, $4), ($2, $4), ($3, $4)');
    });
});


describe("sqlForObjectArray", function(){
    test("works", function(){
        const result = sqlForObjectArray([{
                        'team1Id': 1,
                        'team2Id': 2,
                        'gameDate': '12/2/21',
                        'gameTime': '1:00pm',
                        'gameLocation': 'testLocation',
                        'team1Score': 42,
                        'team2Score': 21,
                        'notes': 'what a test'
                    },
                    {
                        'team1Id': 2,
                        'team2Id': 3,
                        'gameDate': '12/3/21',
                        'gameTime': '2:00pm',
                        'gameLocation': 'testLocation2',
                        'team1Score': 55,
                        'team2Score': 77,
                        'notes': 'not a test'
        }]);
        expect(result).toEqual({
            dollars: `($1, $2, $3, $4, $5, $6, $7, $8, $17), ($9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            values: [1, 2, '12/2/21', '1:00pm', 'testLocation', 42,
                    21, 'what a test', 2, 3, '12/3/21', '2:00pm',
                    'testLocation2', 55, 77, 'not a test']});
    });

    test("works missing data", function(){
        const result = sqlForObjectArray([{
                        'team1Id': 1,
                        'team2Id': 2,
                        'gameDate': '',
                        'gameTime': '',
                        'gameLocation': '',
                        'team1Score': '',
                        'team2Score': '',
                        'notes': ''
                    },
                    {
                        'team1Id': 2,
                        'team2Id': 3,
                        'gameDate': '',
                        'gameTime': '',
                        'gameLocation': '',
                        'team1Score': '',
                        'team2Score': '',
                        'notes': ''
        }]);
        expect(result).toEqual({
            dollars: `($1, $2, $3, $4, $5, $6, $7, $8, $17), ($9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            values: [1, 2, '', '', '', '',
                    '', '', 2, 3, '', '',
                    '', '', '', '']});
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