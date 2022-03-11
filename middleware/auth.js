const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers && req.headers.authorization;
        if (authHeader) {
            const token = authHeader.replace(/^[Bb]earer /, "").trim();
            res.locals = jwt.verify(token, SECRET_KEY);
        };
        return next();
    } catch (err) {
        return next();
    };
};

function ensureLoggedIn(req, res, next) {
    try {
        if (!res.locals.user) throw new UnauthorizedError();
        return next();
    } catch (err) {
        return next(err);
    };
};

function ensureSuperAdmin(req, res, next) {
    try {
        if (!(res.locals.user && res.locals.user.superAdmin)) {
            throw new UnauthorizedError();
        }
        return next();
    } catch (err) {
        return next(err);
    };
};

function ensureLocalAdmin(req, res, next) {
    try {
        const user = res.locals.user;
        const org = req.params.id;
        if (!(user && (user.superAdmin || (user.organizations[org] && user.organizations[org].adminLevel === 1)))) {
            throw new UnauthorizedError();
        };
        return next();
    } catch (err) {
        return next(err);
    };
};

function ensureLocalEditor(req, res, next) {
    try {
        const user = res.locals.user;
        const org = req.params.id;
        if (!(user && (user.superAdmin || (user.organizations[org] && parseInt(user.organizations[org].adminLevel) <= 2)))) {
            throw new UnauthorizedError();
        };
        return next();
    } catch (err) {
        return next(err);
    };
};

function ensureCorrectUserOrSuperAdmin(req, res, next) {
    try {
        const user = res.locals.user;
        if (!(user && (user.superAdmin || user.email === req.params.email))) {
            throw new UnauthorizedError();
        };
        return next();
    } catch (err) {
        return next(err);
    };
};

function ensureCorrectUserOrLocalAdmin(req, res, next) {
    try {
        const user = res.locals.user;
        const org = req.body ? req.body.orgId : null;
        if (!(user && (user.superAdmin || user.email === req.params.email || 
                    (user.organizations[org] && user.organizations[org].adminLevel === 1)))) {
            throw new UnauthorizedError();
        };
        return next();
    } catch (err) {
        return next(err);
    };
};

module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureSuperAdmin,
    ensureLocalAdmin,
    ensureLocalEditor,
    ensureCorrectUserOrSuperAdmin,
    ensureCorrectUserOrLocalAdmin
};