const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config");

class User {

    //Validate user login and return user and organization info
    static async login(email, pwd) {

        const result = await db.query(
            `SELECT users.email,
                    pwd,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    super_admin AS "superAdmin",
                    org_id AS "orgId",
                    org_name AS "orgName",
                    admin_level AS "adminLevel"
            FROM users LEFT JOIN user_organizations ON 
                users.email = user_organizations.email
                LEFT JOIN organizations ON user_organizations.org_id =
                organizations.id
                WHERE users.email = $1`,
            [email]
        );

        let user = result.rows;
        
        if (user[0]) {
            const isValid = await bcrypt.compare(pwd, user[0].pwd);
            if (isValid === true) {
                for (let row of user){
                    delete row.pwd;
                }
                return user;
            };
        };

        throw new UnauthorizedError("Invalid email/password");
    };

    //Create new user
    static async create({email, pwd, firstName, lastName, superAdmin=false}) {

        //Check for duplicate email
        const isDupe = await db.query(
            `SELECT email
            FROM users
            WHERE email = $1`,
            [email]
        );

        if (isDupe.rows[0]) {
            throw new BadRequestError(`There is already an account
                                        associated with ${email}`);
        };

        const hashedPwd = await bcrypt.hash(pwd, BCRYPT_WORK_FACTOR);

        const result = await db.query(
            `INSERT INTO users
                    (email,
                    pwd,
                    first_name,
                    last_name,
                    super_admin)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING email, first_name AS "firstName", 
                    last_name AS "lastName", super_admin AS "superAdmin"`,
            [email, hashedPwd, firstName, lastName, superAdmin]
        );

        const user = result.rows[0];
        return user;
    };

    //Retrieve single user from email
    static async get(email) {
        const result = await db.query(
            `SELECT users.email,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    super_admin AS "superAdmin",
                    org_id AS "orgId",
                    org_name AS "orgName",
                    admin_level AS "adminLevel"
            FROM users LEFT JOIN user_organizations ON 
                users.email = user_organizations.email
                LEFT JOIN organizations ON user_organizations.org_id =
                organizations.id
                WHERE users.email = $1`,
            [email]
        );
        const user = result.rows;
        if (!user[0]) throw new NotFoundError(`No user with email ${email}`);
        return user;
    };

    //Retrieve all users from an organization
    static async getAll(orgId) {
        const result = await db.query(
            `SELECT users.email,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    super_admin AS "superAdmin",
                    org_id AS "orgId",
                    org_name AS "orgName",
                    admin_level AS "adminLevel"
            FROM users LEFT JOIN user_organizations ON 
                users.email = user_organizations.email
                LEFT JOIN organizations ON user_organizations.org_id =
                organizations.id
                WHERE organizations.id = $1
                ORDER BY admin_level`,
            [orgId]
        );
        const users = result.rows;
        if (!users[0]) {
            const orgCheck = await db.query(
                `SELECT id FROM organizations WHERE id = $1`,
                [orgId]
            );
            if (!orgCheck.rows[0]) throw new NotFoundError("Organization not found");
            throw new NotFoundError("No users associated with this organization");
        };
        
        return users;
    };

    //Add organization to a user
    static async addUserOrganization(email, orgId, adminLevel) {
        const result = await db.query(
            `INSERT INTO user_organizations
                    (email, org_id, admin_level)
            VALUES ($1, $2, $3)
            RETURNING email, org_id AS "orgId", admin_level AS "adminLevel"`,
            [email, orgId, adminLevel]
        );
        return result.rows[0];
    };

    //Remove user from organization
    static async removeUserOrganization(email, orgId) {
        const result = await db.query(
            `DELETE FROM user_organizations
            WHERE email = $1 AND org_id = $2
            RETURNING email, org_id AS "orgId"`,
            [email, orgId]
        );
        if (!result.rows[0]) throw new BadRequestError("User is not connected to organization");
        return result.rows[0];
    };

    //Update user info
    static async update(email, data) {
        if (data.pwd) {
            data.pwd = await bcrypt.hash(data.pwd, BCRYPT_WORK_FACTOR);
        };

        const { setCols, values } = sqlForPartialUpdate(
            data,
            {   firstName: "first_name",
                lastName: "last_name",
                superAdmin: "super_admin"
            });
        const emailVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE email = ${emailVarIdx} 
                      RETURNING email,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                super_admin AS "superAdmin"`;
        const result = await db.query(querySql, [...values, email]);
        const user = result.rows[0];
                            
        if (!user) throw new NotFoundError(`No user with email: ${email}`);
                            
        return user;
    };

    //Update user organization admin level
    static async updateAdmin(email, orgId, adminLevel) {
        const result = await db.query(
            `UPDATE user_organizations
            SET admin_level = $1
            WHERE email = $2
            AND org_id = $3
            RETURNING email, org_id AS "orgId", admin_level AS "adminLevel"`,
            [adminLevel, email, orgId]
        );
        const userOrg = result.rows[0];
        if (!userOrg) throw new BadRequestError("Update failed");
        return userOrg;
    };

};

module.exports = User;