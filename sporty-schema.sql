CREATE TABLE users (
    email TEXT PRIMARY KEY,
    pwd TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    super_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    org_name TEXT NOT NULL
);

CREATE TABLE user_organizations (
    email TEXT REFERENCES users ON UPDATE CASCADE,
    org_id INTEGER REFERENCES organizations ON DELETE CASCADE,
    admin_level INTEGER NOT NULL CHECK (admin_level > 0) 
                CHECK (admin_level <=3) DEFAULT 3,
    PRIMARY KEY (email, org_id)
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    team_name TEXT NOT NULL,
    record TEXT
);

CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    org_id INTEGER REFERENCES organizations ON DELETE CASCADE
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    team_1_id INTEGER REFERENCES teams,
    team_2_id INTEGER REFERENCES teams,
    season_id INTEGER REFERENCES seasons,
    game_date DATE,
    game_time TEXT,
    result TEXT,
    notes TEXT
);