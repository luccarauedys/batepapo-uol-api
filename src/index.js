import express, { json } from "express"
import { MongoClient, ObjectId } from "mongodb"
import cors from "cors"
import Joi from "joi"
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

app.post("/participants", async (req, res) => {
  const participant = req.body
  const validation = validateParticipant(participant)
  if (validation.error) {
    return res.sendStatus(422)
  }
  const participants = database.collection("participants")
  const alreadyExists = await participants.find(participant).toArray()
  if (alreadyExists.length > 0) {
    return res.sendStatus(409)
  }
  await participants.insertOne({ ...participant, lastStatus: Date.now() })
  res.sendStatus(201)
})

app.listen(process.env.PORT, () => {
  console.log("Listening on port", process.env.PORT)
})
