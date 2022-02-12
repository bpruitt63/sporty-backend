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

CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    org_id INTEGER REFERENCES organizations ON DELETE CASCADE
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    team_name TEXT NOT NULL,
    season_id INTEGER REFERENCES seasons ON DELETE CASCADE
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    team_1_id INTEGER REFERENCES teams ON DELETE CASCADE,
    team_2_id INTEGER REFERENCES teams ON DELETE CASCADE,
    season_id INTEGER REFERENCES seasons ON DELETE CASCADE,
    game_date TEXT,
    game_time TEXT,
    game_location TEXT,
    team_1_score INTEGER,
    team_2_score INTEGER,
    notes TEXT
);