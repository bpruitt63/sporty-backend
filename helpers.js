const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("./config");
const { BadRequestError } = require("./expressError");

function createToken(user) {
    let payload = {
        user: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            superAdmin: user.superAdmin || false,
            organizations: user.organizations
        }
    };
    return jwt.sign(payload, SECRET_KEY);
};

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError("No data");
  
    const cols = keys.map((colName, idx) =>
        `"${jsToSql[colName] || colName}"=$${idx + 1}`,
    );
  
    return {
      setCols: cols.join(", "),
      values: Object.values(dataToUpdate),
    };
};

/**Transforms array of user/organization objects into
 * single user object with array of organization objects
 */
function formatUserInfo(userRows) {
    let user = {
        email: userRows[0].email,
        firstName: userRows[0].firstName,
        lastName: userRows[0].lastName,
        superAdmin: userRows[0].superAdmin,
        organizations: {}
    };
    for (let row of userRows) {
        user.organizations[row.orgId] = {orgName: row.orgName,
                                        adminLevel: row.adminLevel}
    };
    // for (let row of userRows){
    //     let org = {
    //         orgId: row.orgId,
    //         orgName: row.orgName,
    //         adminLevel: row.adminLevel
    //     };
    //     user.organizations.push(org);
    // };
    return user;
};
  
module.exports = { createToken, sqlForPartialUpdate, formatUserInfo };