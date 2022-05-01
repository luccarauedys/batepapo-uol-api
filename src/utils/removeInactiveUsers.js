import dayjs from "dayjs"

export default function removeInactiveUsers(participants, messages) {
  setInterval(async () => {
    const tenSecsAgo = Date.now() - 10000
    try {
      const inactiveUsers = await participants
        .find({
          lastStatus: { $lt: tenSecsAgo },
        })
        .toArray()

      inactiveUsers.forEach(async (inactiveUser) => {
        await participants.deleteOne(inactiveUser)
        await messages.insertOne({
          from: inactiveUser.name,
          to: "Todos",
          text: "saiu da sala...",
          type: "status",
          time: dayjs().format("HH:mm:ss"),
        })
      })
    } catch (err) {
      console.log(err)
    }
  }, 15000)
}
