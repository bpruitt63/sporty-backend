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

function sqlForVariableArraySize(dataArray) {
    if (!dataArray[0]) throw new BadRequestError("No data");

    const dollars = [];
    for (let i = 1; i <= dataArray.length; i++) {
        dollars.push(`($${i}, $${dataArray.length + 1})`);
    };
    return dollars.join(', ')
};

function sqlForObjectArray(dataArray) {
    if (dataArray.length === 0) throw new BadRequestError("No data");
    let dollars = '';
    let values = [];
    for (let i = 0; i < dataArray.length; i++) {
        const vals = Object.values(dataArray[i]);
        const dols = [];
        for (let j = 0; j < vals.length; j++) {
            dols.push(`$${(i * vals.length) + (j + 1)}`);
        };
        values = [...values, ...vals];
        dollars = dollars + (dollars ? ', ' : '') +
            `(${dols.join(', ')}, $${(dataArray.length * vals.length) + 1})`;
    };
    return {values, dollars};
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
    return user;
};

  
module.exports = { createToken, 
    sqlForPartialUpdate, 
    formatUserInfo,
    sqlForVariableArraySize,
    sqlForObjectArray};