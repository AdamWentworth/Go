import sqlite3
import math
import pandas as pd

# Connect to the database (assuming the database is in the specified directory)
conn = sqlite3.connect('../pokego.db')
cursor = conn.cursor()

# Retrieve Venusaur's base stats
cursor.execute("SELECT attack, defense, stamina FROM pokemon WHERE pokemon_id = 3")
venusaur_stats = cursor.fetchone()
conn.close()

# Extract base stats
base_attack = venusaur_stats[0]
base_defense = venusaur_stats[1]
base_stamina = venusaur_stats[2]

# Define IVs
iv_attack = 15
iv_defense = 15
iv_stamina = 15

# Define CP Multiplier per level (these values are known from game data)
cp_multipliers = [
    0.094, 0.135137432, 0.16639787, 0.192650919, 0.21573247, 0.236572661, 0.25572005, 0.273530381, 0.29024988, 0.306057377,
    0.3210876, 0.335445036, 0.34921268, 0.362457751, 0.37523559, 0.387592406, 0.39956728, 0.411193551, 0.42250001, 0.432926419,
    0.44310755, 0.4530599578, 0.46279839, 0.472336083, 0.48168495, 0.4908558, 0.49985844, 0.508701765, 0.51739395, 0.525942511,
    0.53435433, 0.542635767, 0.55079269, 0.558830576, 0.56675452, 0.574569153, 0.58227891, 0.589887917, 0.59740001, 0.604818814,
    0.61215729, 0.619404122, 0.62656713, 0.633649143, 0.64065295, 0.647580966, 0.65443563, 0.661219252, 0.667934, 0.674581895,
    0.68116492, 0.687684903, 0.69414365, 0.70054287, 0.7068842, 0.713169109, 0.71939909, 0.72557561, 0.7317, 0.734741009,
    0.73776948, 0.740785574, 0.74378943, 0.746781211, 0.74976104, 0.752729087, 0.7556855, 0.758630368, 0.76156384, 0.764486065,
    0.76739717, 0.770297266, 0.7731865, 0.776064962, 0.77893275, 0.78179006, 0.78463697, 0.787473578, 0.79030001,
    0.792803968, 0.79530001, 0.797800015, 0.8003, 0.802799995, 0.8053, 0.8078, 0.81029999, 0.812799985, 0.81529999,
    0.81779999, 0.82029999, 0.82279999, 0.82529999, 0.82779999, 0.83029999, 0.83279999, 0.83529999, 0.83779999,
    0.84029999, 0.84279999, 0.84529999
]

# Calculate CP for each level
def calculate_cp(base_attack, base_defense, base_stamina, iv_attack, iv_defense, iv_stamina, cp_multiplier):
    attack = base_attack + iv_attack
    defense = base_defense + iv_defense
    stamina = base_stamina + iv_stamina
    cp = math.floor((attack * math.sqrt(defense) * math.sqrt(stamina) * cp_multiplier ** 2) / 10)
    return cp

# Generate CP values for levels 1 to 51
cp_values = []
for level_index in range(101):  # 101 half levels from 1 to 51 (including 50.5)
    level = 1 + level_index / 2
    cp_multiplier = cp_multipliers[level_index]
    cp = calculate_cp(base_attack, base_defense, base_stamina, iv_attack, iv_defense, iv_stamina, cp_multiplier)
    cp_values.append((level, cp))

# Create a DataFrame to display the CP values
cp_df = pd.DataFrame(cp_values, columns=['Level', 'Max CP'])

# Set pandas options to display all rows
pd.set_option('display.max_rows', None)

# Display the DataFrame
print(cp_df)
