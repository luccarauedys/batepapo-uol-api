import express, { json } from "express"
import { MongoClient, ObjectId } from "mongodb"
import cors from "cors"
import dayjs from "dayjs"
import dotenv from "dotenv"

import {
  validateParticipant,
  validateMessage,
} from "./utils/validationSchemas.js"

dotenv.config()

const app = express().use(cors()).use(json())

let username = null
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
  try {
    const allParticipants = await participants.find().toArray()
    res.send(allParticipants)
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
})

app.post("/participants", async (req, res) => {
  const participant = req.body
  const participants = database.collection("participants")
  const messages = database.collection("messages")

  const validation = validateParticipant(participant)
  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message)
    console.log(errors)
    return res.sendStatus(422)
  }
  username = req.body

  try {
    const alreadyExists = await participants.find(participant).toArray()
    if (alreadyExists.length > 0) {
      return res.status(409).send("this user already exists")
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
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
})

app.post("/messages", async (req, res) => {
  const message = req.body
  const { user } = req.headers
  const participants = database.collection("participants")
  const messages = database.collection("messages")

  try {
    const messageValidation = validateMessage(message)
    const userValidation = await participants.find({ name: user }).toArray()
    if (messageValidation.error) {
      const errors = messageValidation.error.details.map(
        (detail) => detail.message
      )
      console.log(errors)
      return res.sendStatus(422)
    }
    if (userValidation.length === 0) {
      return res.status(422).send("this user is not in the chat room")
    }

    await messages.insertOne({
      ...message,
      from: user,
      time: dayjs().format("HH:mm:ss"),
    })
    res.sendStatus(201)
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
})

app.get("/messages", async (req, res) => {
  const limit = parseInt(req.query.limit) || null
  const messages = database.collection("messages")
  try {
    const allMessages = await messages.find().toArray()
    const allowedMessages = allMessages.filter((message) => {
      return message.to === "Todos" || message.to === username
    })
    if (limit) {
      return res.send(allowedMessages.slice(`-${limit}`))
    }
    res.send(allowedMessages)
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
})

app.listen(process.env.PORT, () => {
  console.log("Listening on port", process.env.PORT)
})
