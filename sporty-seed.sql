INSERT INTO users (email, pwd, first_name, last_name, super_admin)
VALUES ('test@test.com',
        '$2b$12$gJCw24a1UU23B1wLVufMZeBCEgYnketxQ.AgRIgRex/XNCwKqOG/y',
        'Bob',
        'Testy',
        TRUE),
        ('test2@test.com',
        '$2b$12$gJCw24a1UU23B1wLVufMZeBCEgYnketxQ.AgRIgRex/XNCwKqOG/y',
        'Barb',
        'Tasty',
        FALSE),
        ('test3@test.com',
        '$2b$12$gJCw24a1UU23B1wLVufMZeBCEgYnketxQ.AgRIgRex/XNCwKqOG/y',
        'Bulb',
        'Toasty',
        FALSE);

INSERT INTO organizations (org_name)
VALUES  ('Org1'),
        ('Org2');

INSERT INTO user_organizations (email, org_id, admin_level)
VALUES ('test3@test.com',
        1,
        3),
        ('test2@test.com',
        1,
        2),
        ('test2@test.com',
        2,
        1);