const db = require("../db");
const { NotFoundError } = require("../expressError");

class Organization {

    //Retrieve a single organization by ID
    static async get(orgId) {
        const result = await db.query(
            `SELECT id AS "orgId",
                    org_name AS "orgName"
            FROM organizations
            WHERE id = $1`,
            [orgId]
        );

        const org = result.rows[0];

        if (org) return org;
        throw new NotFoundError("Organization not found");
    };

    //Perform a fuzzy search of organization names
    static async search(orgName) {
        const result = await db.query(
            `SELECT id AS "orgId",
                    org_name AS "orgName"
            FROM organizations
            WHERE SIMILARITY (org_name, $1) > 0.2
            ORDER BY SIMILARITY (org_name, $1) DESC
            LIMIT 10`,
            [orgName]
        );

        const orgs = result.rows;
        return orgs;
    };

    //Add a new organization
    static async add(orgName) {
        const result = await db.query(
            `INSERT INTO organizations
                (org_name)
            VALUES ($1)
            RETURNING id AS "orgId",
                org_name AS "orgName"`,
            [orgName]
        );

        const org = result.rows[0];
        return org;
    };

    //Update organization name
    static async update(orgId, orgName){
        const result = await db.query(
            `UPDATE organizations
            SET org_name = $1
            WHERE id = $2
            RETURNING id AS "orgId",
                org_name AS "orgName"`,
            [orgName, orgId]
        );
        const org = result.rows[0];
        if (!org) throw new NotFoundError('Organization not found');
        return org;
    };

    //Delete organization
    static async remove(orgId) {
        const result = await db.query(
            `DELETE FROM organizations
            WHERE id = $1
            RETURNING id`,
            [orgId]
        );
        const org = result.rows[0]
        if (!org) throw new NotFoundError("Organization not found");
    };

};

module.exports = Organization;