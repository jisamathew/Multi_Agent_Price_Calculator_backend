import "dotenv/config";

import express from "express";
import { MongoClient } from "mongodb";
import { app } from "./graph.js";
import cors from "cors";  // 1. IMPORT THE CORS PACKAGE

const server = express();
server.use(express.json());

const port = 3000;
// 2. USE THE CORS MIDDLEWARE
// This tells your server to add the required headers to allow requests from other origins.
server.use(cors());

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URI);

async function main() {
  await client.connect();
  console.log("Connected to MongoDB");

  server.post("/calculate", async (req, res) => {
    const { userInput, threadId } = req.body;

    if (!userInput) {
      return res.status(400).send({ error: "userInput is required" });
    }

    // A simple way to manage conversations by an ID.
    const config = { configurable: { thread_id: threadId || "new-thread" } };

    const inputs = {
      userInput,
    };

    const finalState = await app.invoke(inputs, config);

    // Save the final state to MongoDB for history
    const db = client.db("price_calculator");
    const collection = db.collection("calculations");
    await collection.insertOne({ ...finalState, threadId: config.configurable.thread_id, timestamp: new Date() });


    res.send({ result: finalState.result });
  });

  server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

main().catch(console.error);