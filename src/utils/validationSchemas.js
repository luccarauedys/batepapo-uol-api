import Joi from "joi"

const participantSchema = Joi.object({
  name: Joi.string().required(),
})

const messageSchema = Joi.object({
  to: Joi.string().min(1).required(),
  text: Joi.string().min(1).required(),
  type: Joi.string()
    .pattern(/private_message$|message$/)
    .required(),
})

export function validateParticipant(participant) {
  return participantSchema.validate(participant)
}

export function validateMessage(message) {
  return messageSchema.validate(message, { abortEarly: false })
}

export function validateUser(user, listOfParticipants) {
  // const validUserSchema = Joi.object({
  //   name: Joi.string()
  //     .required()
  //     .allow(...listOfParticipants),
  // })

  const validUserSchema = Joi.string()
    .required()
    .allow(...listOfParticipants)

  return validUserSchema.validate(user)
}
