import express from 'express';
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig.js';
import twilio from 'twilio';
import dotenv from 'dotenv';
import twilioRoutes from './routes/twilioRoutes.js';

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

// init a simple json database from node-json. This is used here for testing purposes only.
// in a real project, any other database can be used.
const db = new JsonDB(new Config('twoAuthTestDatabase', true, false, '/'));

// this is set for the twilio routes. 2FA using phone number.
app.use('/api/twilio', twilioRoutes);

app.get('/api', (req, res) => res.json({ message: 'Two Factor Auth' }));

//Register a user and Generate the Temp Secret. This route will create a temp secret that will
// be changed to a permanent secret once the user is verified.

app.post('/api/register', (req, res) => {
  const id = uuidv4();

  try {
    const tempSecret = speakeasy.generateSecret();
    db.push(`/user/${id}`, { id, tempSecret });
    res.json({ id, secret: tempSecret.base32 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error with Secret Generation' });
  }
});

// Verify the user using token from authenticator then convert the temp secret to
// permanent secret.

app.post('/api/verify', (req, res) => {
  const { token, id } = req.body;

  try {
    const path = `/user/${id}`;
    const user = db.getData(path);
    const { base32: secret } = user.tempSecret;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
    });

    if (verified) {
      db.push(path, { id, secret: user.tempSecret });
      res.json({ verified: true });
    } else {
      res.json({ verified: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'User not found' });
  }
});

// Validate the user upon every login using the authenticator.

app.post('/api/validate', (req, res) => {
  const { token, id } = req.body;

  try {
    const path = `/user/${id}`;
    const user = db.getData(path);
    const { base32: secret } = user.secret;

    const validated = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
    });

    if (validated) {
      res.json({ validated: true });
    } else {
      res.json({ validated: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'User not found' });
  }
});

app.listen(PORT, () => console.log(`server running on port ${PORT}`));
