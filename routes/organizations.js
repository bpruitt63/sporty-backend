const express = require("express");
const jsonschema = require('jsonschema');
const Organization = require('../models/organization');
const organizationNewSchema = require('../schemas/organizationNew.json');
const teamNameSchema = require('../schemas/teamName.json');
const seasonNameSchema = require('../schemas/seasonName.json');
const { BadRequestError, ForbiddenError } = require("../expressError");
const { ensureLoggedIn, 
    ensureLocalAdmin, 
    ensureLocalEditor } = require('../middleware/auth');

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

router.post('/:id/:seasonId/teams', ensureLocalEditor, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body.teams, teamNameSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };
        const checkId = (await Organization.getSeason(req.params.seasonId)).orgId;
        if (checkId != req.params.id) throw new ForbiddenError(`Season does not belong to this organization`);
        const teams = await Organization.addTeams(req.body.teams, req.params.seasonId);
        return res.json({teams});
    } catch(err) {
        return next(err);
    };
});

router.get('/:id/:seasonId/teams', async function(req, res, next){
    try {
        const teams = await Organization.getTeams(req.params.seasonId);
        return res.json({teams});
    } catch(err) {
        return next(err);
    };
});

router.patch('/:id/:seasonId/:teamId', ensureLocalEditor, async function(req, res, next){
    try {
        const validator = jsonschema.validate([req.body.team], teamNameSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };
        const checkId = (await Organization.getTeam(req.params.teamId)).orgId;
        if (checkId != req.params.id) throw new ForbiddenError(`Organization and team don't match`);
        const team = await Organization.updateTeam(req.params.teamId, 
                                                    req.body.team);
        return res.json({team});
    } catch(err) {
        return next(err);
    };
});

router.delete('/:id/:seasonId/:teamId', ensureLocalEditor, async function(req, res, next){
    try {
        const checkId = (await Organization.getTeam(req.params.teamId)).orgId;
        if (checkId != req.params.id) throw new ForbiddenError(`Organization and team don't match`);
        await Organization.removeTeam(req.params.teamId);
        return res.json({deleted: req.params.teamId});
    } catch(err) {
        return next(err);
    };
});

router.post('/:id/seasons', ensureLocalEditor, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body, seasonNameSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };
        const season = await Organization.addSeason(req.body.title, req.params.id);
        return res.json({season});
    } catch(err) {
        return next(err);
    };
});

router.get('/:id/seasons', async function(req, res, next){
    try {
        const seasons = await Organization.getSeasons(req.params.id);
        return res.json({seasons});
    } catch(err) {
        return next(err);
    };
});

router.patch('/:id/season:seasonId', ensureLocalEditor, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body, seasonNameSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        };
        const checkId = (await Organization.getSeason(req.params.seasonId)).orgId;
        if (checkId != req.params.id) throw new ForbiddenError(`Organization and season don't match`);
        const season = await Organization.updateSeason(req.params.seasonId, 
                                                    req.body.title);
        return res.json({season});
    } catch(err) {
        return next(err);
    };
});

router.delete('/:id/season:seasonId', ensureLocalEditor, async function(req, res, next){
    try {
        const checkId = (await Organization.getSeason(req.params.seasonId)).orgId;
        if (checkId != req.params.id) throw new ForbiddenError(`Organization and season don't match`);
        await Organization.removeSeason(req.params.seasonId);
        return res.json({deleted: req.params.seasonId});
    } catch(err) {
        return next(err);
    };
});

module.exports = router;