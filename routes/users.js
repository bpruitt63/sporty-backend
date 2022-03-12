const express = require("express");
const jsonschema = require('jsonschema');
const User = require('../models/user');
const loginSchema = require('../schemas/loginSchema.json');
const userNewSchema = require('../schemas/userNew.json');
const userUpdateSchema = require('../schemas/userUpdate.json');
const adminUpdateSchema = require('../schemas/userUpdateLocalAdmin.json');
const { BadRequestError, UnauthorizedError } = require("../expressError");
const { createToken, formatUserInfo } = require("../helpers");
const { ensureSuperAdmin, 
        ensureCorrectUserOrSuperAdmin, 
        ensureLocalAdmin, 
        ensureCorrectUserOrLocalAdmin} = require("../middleware/auth");

const router = new express.Router();

/** Route to validate and log in a registered user, returns token */
router.post('/login', async function(req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, loginSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };

        const {email, pwd} = req.body;
        let user = await User.login(email, pwd);
        user = formatUserInfo(user);
        const token = createToken(user);

        return res.json({token});

    } catch(err) {
        return next(err);
    };
});

/** For new user registration, returns token */
router.post('/register', async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };

        const {email, pwd, firstName, lastName} = req.body;
        const superAdmin = false;
        let user = await User.create({email, pwd, firstName, lastName, superAdmin});

        const token = createToken(user);

        return res.json({token});
    } catch(err) {
        return next(err);
    };
});

/** For super admin to create new user
 * Returns email, first and last name, super admin
 */
router.post('/create', ensureSuperAdmin, async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };

        const {email, pwd, firstName, lastName, superAdmin} = req.body;
        let user = await User.create({email, pwd, firstName, lastName, superAdmin});
        return res.json({user});
    } catch(err) {
        return next(err);
    };
});

/** For user to update basic info or super admin to update all info 
 * Returns email, first and last name, super admin
*/
router.patch('/:email', ensureCorrectUserOrSuperAdmin, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };
        if (req.body.superAdmin && !res.locals.user.superAdmin) {
            throw new UnauthorizedError("Only Super Admins can grant Super Admin permissions");
        };
        let user = await User.update(req.params.email, req.body);

        let token;

        //Update token if user is editing self
        if (res.locals.user.email === req.params.email) {
            user = await User.get(user.email);
            user = formatUserInfo(user);
            token = createToken(user);
        };
        return res.json({user, token});
    } catch(err) {
        return next(err);
    };
});

/** Get single user info
 * Returns email, first and last name, super admin, organizations object
 */
router.get('/:email', ensureCorrectUserOrLocalAdmin, async function(req, res, next){
    try {
        let user = await User.get(req.params.email);
        user = formatUserInfo(user);
        return res.json({user});
    } catch(err) {
        return next(err);
    };
});

/** Get all users from organization
 * Returns email, first and last name, super admin, organizations object for each
 */
router.get('/org/:id', ensureLocalAdmin, async function(req, res, next){
    try {
        const users = await User.getAll(req.params.id);
        for (let i = 0; i < users.length; i++){
            users[i] = formatUserInfo([users[i]]);
        };
        return res.json({users});
    } catch(err) {
        return next(err);
    };
});

/**Add user organization
 * Returns user email, first and last name, super admin,
 * organization id, name, admin level,
 * updated token if user belongs to organization
 */
router.post('/org:id/:email', ensureCorrectUserOrLocalAdmin, async function(req, res, next){
    try {
        const u = res.locals.user;

        /** Added user can only have organizational permissions if
         * added by super admin, organizational admin, or
         * if initially creating the organization themselves
         */
        if (req.body.adminLevel && u.email !== req.params.email &&
                    !(u.superAdmin || (u.organizations[req.params.id] &&
                    u.organizations[req.params.id].adminLevel === 1))) {
                const orgUsers = await User.getAll(req.params.id);
                if (orgUsers) {
                    delete req.body.adminLevel;
                };
        };

        const validator = jsonschema.validate(req.body, adminUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };
        let user = await User.addUserOrganization(req.params.email,
                                        req.params.id, req.body.adminLevel || 3);
        user = formatUserInfo(user);
        let token;

        /** Adds organization to user if user is adding self to organization
         * Updates token
         */
        if (u.email === user.email) {
            if (!(null in u.organizations)) {
                user.organizations = {...u.organizations, ...user.organizations};
            };
            token = createToken(user);
        };
        
        return res.json({user, token});
    } catch(err) {
        return next(err);
    };
});

/** Remove user organization, returns email and organization id */
router.delete('/org:id/:email', ensureCorrectUserOrLocalAdmin, async function(req, res, next){
    try {
        const userOrg = await User.removeUserOrganization(
                                        req.params.email, req.params.id);
        return res.json({userOrg});
    } catch(err) {
        return next(err);
    };
});

/** Update local admin level, returns email, organization id, admin level */
router.patch('/org:id/:email', ensureLocalAdmin, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body, adminUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };
        const admin = await User.updateAdmin(req.params.email,
                                         req.params.id, req.body.adminLevel);
        return res.json(admin);
    } catch(err) {
        return next(err);
    };
});


module.exports = router;