import sqlite3
import json

# Connect to the SQLite database
conn = sqlite3.connect('../pokego.db')
cursor = conn.cursor()

# Query to fetch data from cp_multipliers table
cursor.execute("SELECT level_id, multiplier FROM cp_multipliers")
rows = cursor.fetchall()

# Transform the data into a dictionary
cp_multipliers = {row[0]: row[1] for row in rows}

# Define the JavaScript content
js_content = f"const cpMultipliers = {json.dumps(cp_multipliers, indent=2)};\n\nexport default cpMultipliers;"

# Write the content to constants.js file
with open('constants.js', 'w') as file:
    file.write(js_content)

# Close the database connection
conn.close()

print("Data has been successfully written to constants.js")
