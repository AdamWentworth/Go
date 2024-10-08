const { MongoClient, ObjectId } = require('mongodb');

const mongoURI = 'mongodb://localhost:27017/PoGo_App_Users';
const client = new MongoClient(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase server selection timeout
    socketTimeoutMS: 60000,          // Increase socket timeout
    connectTimeoutMS: 30000,         // Increase initial connection timeout
    maxPoolSize: 10                  // Limit the number of concurrent connections to avoid overload
});

async function deleteUsers() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('PoGo_App_Users');
        const usersCollection = db.collection('users');

        const protectedId = "663d6760537fa61b79ac8bab";
        let condition = { _id: { $ne: new ObjectId(protectedId) } };
        let batchSize = 100;
        let totalDeleted = 0;

        while (true) {
            // Fetch a batch of users to delete
            const usersToDelete = await usersCollection.find(condition).limit(batchSize).toArray();
            if (usersToDelete.length === 0) {
                break; // Exit the loop if no more users to delete
            }

            // Extract IDs of users to delete
            const idsToDelete = usersToDelete.map(user => user._id);

            // Delete the batch of users
            const result = await usersCollection.deleteMany({ _id: { $in: idsToDelete } });
            totalDeleted += result.deletedCount;
            console.log(`Deleted ${result.deletedCount} users`);

            // Optional: Delay to prevent overloading the server
            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
        }

        console.log(`Total deleted ${totalDeleted} users`);
    } catch (error) {
        console.error('Failed to delete users:', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Execute the deleteUsers function
deleteUsers();
