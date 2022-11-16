const { createToken, 
    sqlForPartialUpdate, 
    formatUserInfo,
    sqlForObjectArray, 
    formatGamesList,
    gamesListToTournament} = require("../helpers");
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
                    }], {
                        team1Id: 'team_1_id',
                        team2Id: 'team_2_id',
                        gameDate: 'game_date',
                        gameTime: 'game_time',
                        gameLocation: 'game_location',
                        team1Score: 'team_1_score',
                        team2Score: 'team_2_score'
        });
        expect(result).toEqual({
            cols: 'team_1_id, team_2_id, game_date, game_time, game_location, team_1_score, team_2_score, notes,',
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
                    }], {
                        team1Id: 'team_1_id',
                        team2Id: 'team_2_id',
                        gameDate: 'game_date',
                        gameTime: 'game_time',
                        gameLocation: 'game_location',
                        team1Score: 'team_1_score',
                        team2Score: 'team_2_score'
        });
        expect(result).toEqual({
            cols: 'team_1_id, team_2_id, game_date, game_time, game_location, team_1_score, team_2_score, notes,',
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


describe('formatGamesList', function() {
    test('works tournament', function(){
        const tournament = {
            'Round 1': {
                'Game 1': {
                    team1Id: 1,
                    team2Id: 2,
                    team1Color: 'N/A',
                    team2Color: 'N/A',
                    team1Name: 'team1',
                    team2Name: 'team2'
                },
                'Game 2': {
                    team1Id: 3,
                    team2Id: 4,
                    team1Color: 'N/A',
                    team2Color: 'N/A',
                    team1Name: 'team3',
                    team2Name: 'team4'
                }
            },
            'Round 2': {
                'Game 1': {
                    team1Id: 5,
                    team2Id: 6,
                    team1Color: 'N/A',
                    team2Color: 'N/A',
                    team1Name: 'team5',
                    team2Name: 'team6'
                },
                'Game 2': {
                    team1Id: 7,
                    team2Id: 11,
                    team1Color: 'N/A',
                    team2Color: 'N/A',
                    team1Name: 'team7',
                    team2Name: 'team11'
                }
            }
        };
        const result = formatGamesList(tournament);
        expect(result).toEqual([
            {
                team1Id: 1,
                team2Id: 2,
                tournamentRound: 1,
                tournamentGame: 1
            },
            {
                team1Id: 3,
                team2Id: 4,
                tournamentRound: 1,
                tournamentGame: 2
            },
            {
                team1Id: 5,
                team2Id: 6,
                tournamentRound: 2,
                tournamentGame: 1
            },
            {
                team1Id: 7,
                team2Id: 11,
                tournamentRound: 2,
                tournamentGame: 2
            }])
    });
});


describe('gamesListToTournament', function() {
    test('works', function() {
        const gamesList = [
            {
                team1Id: 1,
                team2Id: 2,
                team1Color: 'N/A',
                team2Color: 'N/A',
                team1Name: 'team1',
                team2Name: 'team2',
                tournamentRound: 1,
                tournamentGame: 1
            },
            {
                team1Id: 3,
                team2Id: 4,
                team1Color: 'N/A',
                team2Color: 'N/A',
                team1Name: 'team3',
                team2Name: 'team4',
                tournamentRound: 1,
                tournamentGame: 2
            },
            {
                team1Id: 5,
                team2Id: 6,
                team1Color: 'N/A',
                team2Color: 'N/A',
                team1Name: 'team5',
                team2Name: 'team6',
                tournamentRound: 2,
                tournamentGame: 1
            },
            {
                team1Id: 7,
                team2Id: 11,
                team1Color: 'N/A',
                team2Color: 'N/A',
                team1Name: 'team7',
                team2Name: 'team11',
                tournamentRound: 2,
                tournamentGame: 2
            }];
        const result = gamesListToTournament(gamesList);
        expect(result).toEqual({
            'Round 1': {
                'Game 1': {
                    team1Id: 1,
                    team2Id: 2,
                    team1Color: 'N/A',
                    team2Color: 'N/A',
                    team1Name: 'team1',
                    team2Name: 'team2',
                    tournamentRound: 1,
                    tournamentGame: 1
                },
                'Game 2': {
                    team1Id: 3,
                    team2Id: 4,
                    team1Color: 'N/A',
                    team2Color: 'N/A',
                    team1Name: 'team3',
                    team2Name: 'team4',
                    tournamentRound: 1,
                    tournamentGame: 2
                }
            },
            'Round 2': {
                'Game 1': {
                    team1Id: 5,
                    team2Id: 6,
                    team1Color: 'N/A',
                    team2Color: 'N/A',
                    team1Name: 'team5',
                    team2Name: 'team6',
                    tournamentRound: 2,
                    tournamentGame: 1
                },
                'Game 2': {
                    team1Id: 7,
                    team2Id: 11,
                    team1Color: 'N/A',
                    team2Color: 'N/A',
                    team1Name: 'team7',
                    team2Name: 'team11',
                    tournamentRound: 2,
                    tournamentGame: 2
                }
            }
        })
    });
});