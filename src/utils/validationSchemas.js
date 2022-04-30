import Joi from "joi"

const participantSchema = Joi.object({
  name: Joi.string().required(),
})

export function validateParticipant(participant) {
  return participantSchema.validate(participant)
}
