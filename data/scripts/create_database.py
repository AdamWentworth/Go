import sqlite3

# Connect to the database
conn = sqlite3.connect('data/pokego.db')
cursor = conn.cursor()

# types table
cursor.execute('''
CREATE TABLE types (
    type_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    icon_url TEXT
);
''')

# pokemon table
cursor.execute('''
CREATE TABLE pokemon (
    pokemon_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    pokedex_number INTEGER,
    image_url TEXT,
    image_url_shiny TEXT,
    sprite_url TEXT,
    attack INTEGER,
    defense INTEGER,
    stamina INTEGER,
    type_1_id INTEGER REFERENCES types(type_id),
    type_2_id INTEGER REFERENCES types(type_id),
    gender_rate TEXT,
    rarity TEXT,
    form TEXT,
    generation INTEGER,
    available BOOLEAN,
    shiny_available BOOLEAN
);
''')

# moves table
cursor.execute('''
CREATE TABLE moves (
    move_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type_id INTEGER REFERENCES types(type_id),
    raid_power INTEGER,
    pvp_power INTEGER,
    raid_energy INTEGER,
    pvp_energy INTEGER,
    raid_cooldown INTEGER,
    pvp_turns INTEGER
);
''')

# pokemon_moves table
cursor.execute('''
CREATE TABLE pokemon_moves (
    id INTEGER PRIMARY KEY,
    move_id INTEGER REFERENCES moves(move_id),
    pokemon_id INTEGER REFERENCES pokemon(pokemon_id),
    legacy BOOLEAN
);
''')

# evolution_items table
cursor.execute('''
CREATE TABLE evolution_items (
    item_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT
);
''')

# pokemon_evolutions table
cursor.execute('''
CREATE TABLE pokemon_evolutions (
    evolution_id INTEGER PRIMARY KEY,
    pokemon_id INTEGER REFERENCES pokemon(pokemon_id),
    evolves_from INTEGER REFERENCES pokemon(pokemon_id),
    evolves_to INTEGER REFERENCES pokemon(pokemon_id),
    candies_needed INTEGER,
    trade_discount INTEGER,
    item_id INTEGER REFERENCES evolution_items(item_id),
    other TEXT
);
''')

# shadow_pokemon table
cursor.execute('''
CREATE TABLE shadow_pokemon (
    pokemon_id INTEGER PRIMARY KEY REFERENCES pokemon(pokemon_id),
    shiny_available BOOLEAN,
    apex BOOLEAN
);
''')

# mega_evolution table
cursor.execute('''
CREATE TABLE mega_evolution (
    id INTEGER PRIMARY KEY,
    pokemon_id INTEGER REFERENCES pokemon(pokemon_id),
    mega_energy_cost INTEGER,
    attack INTEGER,
    defense INTEGER,
    stamina INTEGER,
    image_url TEXT,
    image_url_shiny TEXT,
    sprite_url TEXT,
    primal BOOLEAN
);
''')

# costume_pokemon table
cursor.execute('''
CREATE TABLE costume_pokemon (
    costume_id INTEGER PRIMARY KEY,
    pokemon_id INTEGER REFERENCES pokemon(pokemon_id),
    costume_name TEXT NOT NULL
);
''')

# users table
cursor.execute('''
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    trainer_code TEXT
);
''')

# collection table
cursor.execute('''
CREATE TABLE collection (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    pokemon_id INTEGER REFERENCES pokemon(pokemon_id),
    status TEXT,
    cp INTEGER,
    attack_iv INTEGER,
    defense_iv INTEGER,
    stamina_iv INTEGER,
    shiny BOOLEAN,
    costume_id INTEGER REFERENCES costume_pokemon(costume_id),
    lucky BOOLEAN,
    shadow BOOLEAN,
    purified BOOLEAN,
    fast_move TEXT,
    charged_move1 TEXT,
    charged_move2 TEXT,
    weight REAL,
    height REAL,
    gender TEXT
);
''')

# Committing the changes and closing the connection
conn.commit()
conn.close()
