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

//Route to validate and log in a registered user
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

//For new user registration
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
        //user = formatUserInfo(user);
        const token = createToken(user);

        return res.json({token});
    } catch(err) {
        return next(err);
    };
});

//For super admin to create new user
router.post('/create', ensureSuperAdmin, async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };

        const {email, pwd, firstName, lastName, superAdmin} = req.body;
        let user = await User.create({email, pwd, firstName, lastName, superAdmin});
        //user = formatUserInfo(user);
        return res.json(user);
    } catch(err) {
        return next(err);
    };
});

//For user to update basic info or super admin to update all info
router.patch('/:email', ensureCorrectUserOrSuperAdmin, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };

        if (req.body.email) delete req.body.email;
        if (req.body.superAdmin && !res.locals.user.superAdmin) {
            throw new UnauthorizedError("Only Super Admins can grant Super Admin permissions");
        };
        const user = await User.update(req.params.email, req.body);
        return res.json(user);
    } catch(err) {
        return next(err);
    };
});

//Get single user info
router.get('/:email', ensureCorrectUserOrLocalAdmin, async function(req, res, next){
    try {
        let user = await User.get(req.params.email);
        user = formatUserInfo(user);
        return res.json({user});
    } catch(err) {
        return next(err);
    };
});

//Get all users from an organization
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

//Add user organization
router.post('/org:id/:email', ensureCorrectUserOrLocalAdmin, async function(req, res, next){
    try {
        const user = res.locals.user;
        if (req.body.adminLevel && !(user.superAdmin || (user.organizations[req.params.id] &&
                user.organizations[req.params.id].adminLevel === 1))){
            delete req.body.adminLevel;
        } else {
            const validator = jsonschema.validate(req.body, adminUpdateSchema);
            if (!validator.valid) {
                const errs = validator.errors.map(e => e.stack);
                throw new BadRequestError(errs);
            };
        };
        const userOrg = await User.addUserOrganization(req.params.email,
                                        req.params.id, req.body.adminLevel || 3);
        return res.json({userOrg});
    } catch(err) {
        return next(err);
    };
});

//Remove user organization
router.delete('/org:id/:email', ensureCorrectUserOrLocalAdmin, async function(req, res, next){
    try {
        const userOrg = await User.removeUserOrganization(
                                        req.params.email, req.params.id);
        return res.json({userOrg});
    } catch(err) {
        return next(err);
    };
});

//Update local admin level
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