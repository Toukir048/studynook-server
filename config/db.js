const dns = require("dns");
const { MongoClient, ServerApiVersion } = require("mongodb");

const dbName = process.env.DB_NAME || "studynookDB";

const dnsServers = process.env.DNS_SERVERS
  ? process.env.DNS_SERVERS.split(",").map((server) => server.trim())
  : ["8.8.8.8", "1.1.1.1"];

dns.setServers(dnsServers);

let client;
let db;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env file");
  }

  console.log("Using DNS servers:", dnsServers.join(", "));

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();

  db = client.db(dbName);

  await db.command({ ping: 1 });

  console.log(`MongoDB connected successfully: ${dbName}`);
};

const getDB = () => {
  if (!db) {
    throw new Error("Database is not connected yet");
  }

  return db;
};

const getCollections = () => {
  const database = getDB();

  return {
    usersCollection: database.collection("users"),
    roomsCollection: database.collection("rooms"),
    bookingsCollection: database.collection("bookings"),
  };
};

module.exports = {
  connectDB,
  getDB,
  getCollections,
};