import { MongoClient } from "mongodb"
import dotenv from "dotenv"
dotenv.config()

export default async function connectToMongoDB() {
  try {
    const mongoClient = new MongoClient(process.env.MONGO_URI)
    await mongoClient.connect()
    const database = mongoClient.db(process.env.DB_NAME)
    console.log("Successfully connected to mongodb.")

    const participants = database.collection("participants")
    const messages = database.collection("messages")

    return { participants, messages }
  } catch (err) {
    console.log(err)
  }
}
