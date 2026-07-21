const { producer, connectProducer } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/constants/kafka-topics');

const publish = async (topic, key, payload) => {
  await connectProducer();
  await producer.send({
    topic,
    messages: [
      {
        key,
        value: JSON.stringify(payload),
      },
    ],
  });
};

const publishOtpEmail = ({ email, otp, ttlMinutes }) =>
  publish(KAFKA_TOPICS.OTP_EMAIL, email, { email, otp, ttlMinutes });

const publishWelcomeEmail = ({ email, firstName }) =>
  publish(KAFKA_TOPICS.WELCOME_EMAIL, email, { email, firstName });

module.exports = { publishOtpEmail, publishWelcomeEmail };