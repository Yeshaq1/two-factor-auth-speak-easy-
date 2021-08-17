import express from 'express';
import {
  sendValidationCode,
  verfiySmsCode,
} from '../controllers/twilioController.js';

const router = express.Router();

router.route('/validate').get(sendValidationCode);

router.route('/verify').post(verfiySmsCode);

export default router;
