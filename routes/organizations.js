const express = require("express");
const jsonschema = require('jsonschema');
const Organization = require('../models/organization');
const organizationNewSchema = require('../schemas/organizationNew.json');
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureLocalAdmin } = require('../middleware/auth');

const router = new express.Router();

router.get('/:id', async function(req, res, next){
    try {
        const org = await Organization.get(req.params.id);
        return res.json({org});
    } catch(err) {
        return next(err);
    };
});

router.get('/search/:name', async function(req, res, next){
    try {
        const orgs = await Organization.search(req.params.name);
        return res.json({orgs});
    } catch(err) {
        return next(err);
    };
});

router.post('/', ensureLoggedIn, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body, organizationNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };
        const org = await Organization.add(req.body.orgName);
        return res.json({org});
    } catch(err) {
        return next(err);
    };
});

router.patch('/:id', ensureLocalAdmin, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body, organizationNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };
        const org = await Organization.update(req.params.id, req.body.orgName);
        return res.json({org});
    } catch(err) {
        return next(err);
    };
});

router.delete('/:id', ensureLocalAdmin, async function(req, res, next){
    try {
        await Organization.remove(req.params.id);
        return res.json({deleted: req.params.id});
    } catch(err) {
        return next(err);
    };
});

module.exports = router;