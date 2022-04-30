import express, { json } from "express"
import { MongoClient, ObjectId } from "mongodb"
import cors from "cors"
import dayjs from "dayjs"
import dotenv from "dotenv"

import { validateParticipant } from "./utils/validationSchemas.js"

dotenv.config()

const app = express().use(cors()).use(json())

let database = null
const mongoClient = new MongoClient(process.env.MONGO_URI)
mongoClient
  .connect()
  .then(() => {
    database = mongoClient.db(process.env.DB_NAME)
    console.log("Successfully connected to mongodb.")
  })
  .catch((err) => console.log(err))

app.get("/participants", async (req, res) => {
  const participants = database.collection("participants")
  const allParticipants = await participants.find().toArray()
  res.send(allParticipants)
})

app.post("/participants", async (req, res) => {
  const participant = req.body
  const participants = database.collection("participants")
  const messages = database.collection("messages")

  const validation = validateParticipant(participant)
  if (validation.error) {
    return res.sendStatus(422)
  }

  const alreadyExists = await participants.find(participant).toArray()
  if (alreadyExists.length > 0) {
    return res.sendStatus(409)
  }

  await participants.insertOne({ ...participant, lastStatus: Date.now() })

  const message = {
    from: participant.name,
    to: "Todos",
    text: "entra na sala...",
    type: "status",
    time: dayjs().format("HH:mm:ss"),
  }
  await messages.insertOne(message)

  res.sendStatus(201)
})

app.listen(process.env.PORT, () => {
  console.log("Listening on port", process.env.PORT)
})
