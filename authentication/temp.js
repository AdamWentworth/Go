const { MongoClient } = require('mongodb');

async function updateEmptyStringsToNull() {
    const uri = "mongodb://localhost:27017/PoGo_App_Users";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        console.log("Connected to the database");

        const database = client.db("PoGo_App_Users");
        const users = database.collection("users");

        // Update any records where pokemonGoName is an empty string
        const result = await users.updateMany(
            { pokemonGoName: "" },
            { $set: { pokemonGoName: null } }
        );

        console.log(`Updated ${result.modifiedCount} records.`);
    } finally {
        await client.close();
        console.log("Connection closed");
    }
}

updateEmptyStringsToNull().catch(console.error);
