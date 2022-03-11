const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
    authenticateJWT,
    ensureLoggedIn,
    ensureSuperAdmin,
    ensureLocalAdmin,
    ensureLocalEditor,
    ensureCorrectUserOrSuperAdmin,
    ensureCorrectUserOrLocalAdmin
} = require("../middleware/auth");


const { SECRET_KEY } = require("../config");
const testPayload = {email: 'test@test.com',
                    firstName: 'Bob',
                    lastName: 'Testy',
                    superAdmin: false,
                    organizations: {
                        1: {
                            orgName: 'Org1',
                            adminLevel: 3
                        }
                    }};
const testJwt = jwt.sign(testPayload, SECRET_KEY);
const badJwt = jwt.sign(testPayload, "wrong");

describe("authenticateJWT", function () {
    test("works: via header", function () {
        expect.assertions(2);
        const req = { headers: { authorization: `Bearer ${testJwt}` } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        authenticateJWT(req, res, next);
        expect(res.locals).toEqual({
            iat: expect.any(Number),
            email: 'test@test.com',
            firstName: "Bob",
            lastName: "Testy",
            superAdmin: false,
            organizations: {
                1: {
                    orgName: 'Org1',
                    adminLevel: 3
                }
            }});
    });
  
    test("works: no header", function () {
        expect.assertions(2);
        const req = {};
        const res = { locals: {} };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        authenticateJWT(req, res, next);
        expect(res.locals).toEqual({});
    });
  
    test("works: invalid token", function () {
        expect.assertions(2);
        const req = { headers: { authorization: `Bearer ${badJwt}` } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        authenticateJWT(req, res, next);
        expect(res.locals).toEqual({});
    });
});

describe("ensureLoggedIn", function () {
    test("works", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    null: {
                                        orgName: null,
                                        adminLevel: null
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureLoggedIn(req, res, next);
    });
  
    test("unauth if no login", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureLoggedIn(req, res, next);
    });
});

describe("ensureSuperAdmin", function () {
    test("works", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: true,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 3
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureSuperAdmin(req, res, next);
    });
  
    test("unauth if not admin", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 3
                                    }
                                }}}};
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureSuperAdmin(req, res, next);
    });
  
    test("unauth if anon", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureSuperAdmin(req, res, next);
    });
});

describe("ensureLocalAdmin", function () {
    test("works: super admin", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: true,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 3
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureLocalAdmin(req, res, next);
    });
  
    test("works: local admin", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureLocalAdmin(req, res, next);
    });
  
    test("unauth: local editor", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 2
                                    },
                                    2: {
                                        orgName: 'Org2',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureLocalAdmin(req, res, next);
    });

    test("unauth: wrong org", function () {
        expect.assertions(1);
        const req = { params: { id: 2 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureLocalAdmin(req, res, next);
    });
  
    test("unauth: if anon", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureLocalAdmin(req, res, next);
    });
});

describe("ensureLocalEditor", function () {
    test("works: super admin", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: true,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 3
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureLocalEditor(req, res, next);
    });
  
    test("works: local admin", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureLocalEditor(req, res, next);
    });

    test("works: local editor", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 2
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureLocalEditor(req, res, next);
    });
  
    test("unauth: no local permissions", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 3
                                    },
                                    2: {
                                        orgName: 'Org2',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureLocalEditor(req, res, next);
    });

    test("unauth: wrong org", function () {
        expect.assertions(1);
        const req = { params: { id: 2 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureLocalEditor(req, res, next);
    });
  
    test("unauth: if anon", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureLocalEditor(req, res, next);
    });
});

describe("ensureCorrectUserOrSuperAdmin", function () {
    test("works: super admin", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: true,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 3
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureCorrectUserOrSuperAdmin(req, res, next);
    });
  
    test("works: correct user", function () {
        expect.assertions(1);
        const req = { params: { id: 1, email: 'test@test.com'} };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureCorrectUserOrSuperAdmin(req, res, next);
    });
  
    test("unauth: wrong user", function () {
        expect.assertions(1);
        const req = { params: { id: 1, email: 'nope@test.com'} };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: '3'
                                    },
                                    2: {
                                        orgName: 'Org2',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureCorrectUserOrSuperAdmin(req, res, next);
    });
  
    test("unauth: if anon", function () {
        expect.assertions(1);
        const req = { params: { id: 1 } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureCorrectUserOrSuperAdmin(req, res, next);
    });
});

describe("ensureCorrectUserOrLocalAdmin", function () {
    test("works: super admin", function () {
        expect.assertions(1);
        const req = { params: { email: 'test1@test.com' } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: true,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 3
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureCorrectUserOrLocalAdmin(req, res, next);
    });

    test("works: local admin", function () {
        expect.assertions(1);
        const req = { body: { orgId: 1 }, params: { email: 'test1@test.com' } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureCorrectUserOrLocalAdmin(req, res, next);
    });
  
    test("works: correct user", function () {
        expect.assertions(1);
        const req = { body: { orgId: 1 }, params: { email: 'test@test.com' } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureCorrectUserOrLocalAdmin(req, res, next);
    });
  
    test("unauth: wrong user", function () {
        expect.assertions(1);
        const req = { body: { orgId: 1 }, params: { email: 'nope@test.com' } };
        const res = { locals: { user: { email: 'test@test.com',
                                firstName: "Bob",
                                lastName: "Testy",
                                superAdmin: false,
                                organizations: {
                                    1: {
                                        orgName: 'Org1',
                                        adminLevel: '3'
                                    },
                                    2: {
                                        orgName: 'Org2',
                                        adminLevel: 1
                                    }
                                }}}};
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureCorrectUserOrLocalAdmin(req, res, next);
    });
  
    test("unauth: if anon", function () {
        expect.assertions(1);
        const req = { body: { orgId: 1 } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureCorrectUserOrLocalAdmin(req, res, next);
    });
});