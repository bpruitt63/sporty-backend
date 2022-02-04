const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testOrgIds = [];

async function commonBeforeAll() {
    await db.query("DELETE FROM organizations");
    await db.query("DELETE FROM users");
    await db.query("DELETE FROM user_organizations");

    await db.query(`
    INSERT INTO users (email, pwd, first_name, last_name, super_admin)
    VALUES ('test1@test.com',
            $1,
            'Bob',
            'Testy',
            TRUE),
            ('test2@test.com',
            $1,
            'Barb',
            'Tasty',
            FALSE),
            ('test3@test.com',
            $1,
            'Bulb',
            'Toasty',
            FALSE)`,
            [await bcrypt.hash("password", BCRYPT_WORK_FACTOR)]);

    const resultsOrgs = await db.query(`
    INSERT INTO organizations (org_name)
    VALUES  ('Org1'),
            ('Org2'),
            ('Org3'),
            ('TestOrg1')
    RETURNING id`);
    testOrgIds.splice(0, 0, ...resultsOrgs.rows.map(r => r.id));

    await db.query(`
    INSERT INTO user_organizations (email, org_id, admin_level)
    VALUES ('test1@test.com',
            $1,
            3),
            ('test2@test.com',
            $1,
            2),
            ('test2@test.com',
            $2,
            1)`,
            [testOrgIds[0], testOrgIds[1]]);
};

async function commonBeforeEach() {
    await db.query("BEGIN");
};

async function commonAfterEach() {
    await db.query("ROLLBACK");
};

async function commonAfterAll() {
    await db.end();
};


module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testOrgIds,
};