import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('../pokego.db')
cursor = conn.cursor()

# Function to round the value to the nearest multiple of 500
def round_to_nearest_500(value):
    remainder = value % 500
    if remainder == 250:  # Caught exactly between two multiples
        return None
    else:
        return round(value / 500) * 500

# Retrieve all records from the moves table
cursor.execute("SELECT * FROM moves")
moves = cursor.fetchall()

# Get the column names for later reference
column_names = [description[0] for description in cursor.description]

# List to store the records that are exactly between multiples of 500
caught_between_records = []

# Iterate through the moves and update raid_cooldown values
for move in moves:
    raid_cooldown = move[column_names.index('raid_cooldown')]
    rounded_value = round_to_nearest_500(raid_cooldown)
    
    if rounded_value is None:
        caught_between_records.append(move)
    else:
        # Update the record with the rounded value
        cursor.execute("UPDATE moves SET raid_cooldown = ? WHERE move_id = ?", (rounded_value, move[0]))

# Commit the changes to the database
conn.commit()

# Print out the records that are exactly between multiples of 500
if caught_between_records:
    print("Records caught exactly between multiples of 500:")
    for record in caught_between_records:
        print(dict(zip(column_names, record)))
else:
    print("No records were caught exactly between multiples of 500.")

# Close the database connection
conn.close()
