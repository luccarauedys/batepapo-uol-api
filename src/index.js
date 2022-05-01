import express, { json } from "express"
import { ObjectId } from "mongodb"
import cors from "cors"
import dayjs from "dayjs"
import dotenv from "dotenv"

import connectToMongoDB from "./utils/mongoConnection.js"
import removeInactiveUsers from "./utils/removeInactiveUsers.js"
import {
  validateParticipant,
  validateMessage,
} from "./utils/validationSchemas.js"

dotenv.config()

const app = express().use(cors()).use(json())

let [activeUser, participants, messages] = [null, null, null]

const promise = connectToMongoDB()
promise
  .then((collections) => {
    participants = collections.participants
    messages = collections.messages
    removeInactiveUsers(participants, messages)
  })
  .catch((err) => console.log(err))

app.get("/participants", async (req, res) => {
  try {
    const allParticipants = await participants.find().toArray()
    res.send(allParticipants)
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
})

app.post("/participants", async (req, res) => {
  activeUser = req.body.name
  const participant = req.body
  const validation = validateParticipant(participant)

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message)
    console.log(errors)
    return res.sendStatus(422)
  }

  try {
    const alreadyExists = await participants.find(participant).toArray()
    if (alreadyExists.length !== 0) {
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

app.get("/messages", async (req, res) => {
  const limit = parseInt(req.query.limit) || null
  try {
    const allMessages = await messages.find().toArray()
    const allowedMessages = allMessages.filter((message) => {
      return (
        message.to === "Todos" ||
        message.to === activeUser ||
        message.from === activeUser
      )
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

app.post("/messages", async (req, res) => {
  const message = req.body
  const { user } = req.headers

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
      return res.status(422).send("Invalid User.")
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

app.post("/status", async (req, res) => {
  const { user } = req.headers
  try {
    const userInfos = await participants.find({ name: user }).toArray()
    if (userInfos.length === 0) return res.sendStatus(404)
    const id = userInfos[0]._id

    setInterval(async () => {
      await participants.updateOne(
        {
          _id: new ObjectId(id),
        },
        { $set: { ...userInfos[0], lastStatus: Date.now() } }
      )
    }, 5000)

    res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
})

app.listen(process.env.PORT, () => {
  console.log("Listening on port", process.env.PORT)
})
