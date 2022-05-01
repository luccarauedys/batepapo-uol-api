import dayjs from "dayjs"

export default function removeInactiveUsers(participants, messages) {
  if (!participants || !messages) return
  try {
    setInterval(async () => {
      const limit = Date.now() - 10000

      const inactiveUsers = await participants
        .find({
          lastStatus: { $lt: limit },
        })
        .toArray()

      const deleted = await participants.deleteMany({
        lastStatus: { $lt: limit },
      })

      inactiveUsers.forEach(async (inactiveUser) => {
        const message = {
          from: inactiveUser.name,
          to: "Todos",
          text: "saiu da sala...",
          type: "status",
          time: dayjs().format("HH:mm:ss"),
        }

        await messages.insertOne(message)
      })

      console.log(deleted.deletedCount, "inactive users deleted.")
    }, 15000)
  } catch (err) {
    console.log(err)
  }
}
