import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

//Twilio constants:
const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;
const client = new twilio(accountSid, authToken);

//this can be used as a middleware.

//send the verification code
const sendValidationCode = async (req, res) => {
  try {
    const verification = await client.verify
      .services(process.env.SERVICESID)
      .verifications.create({ to: '+15146490752', channel: 'sms' });

    res.json(verification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'User not found' });
  }
};

// verify the user with the code.

const verfiySmsCode = async (req, res) => {
  const code = req.body.code;

  try {
    const verification = await client.verify
      .services(process.env.SERVICESID)
      .verificationChecks.create({ to: '+15146490752', code });

    res.json(verification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'User not found' });
  }
};

export { verfiySmsCode, sendValidationCode };
