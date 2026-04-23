const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const msg91Service = require('../services/msg91Service');

async function test() {
  console.log('Testing MSG91 OTP Service...');
  console.log('Auth Key:', process.env.MSG91_AUTH_KEY ? 'Present' : 'Missing');
  console.log('Template ID:', process.env.MSG91_OTP_TEMPLATE_ID ? 'Present' : 'Missing');

  try {
    const testPhone = '9053535353'; // Use a generic number for testing structure
    console.log(`Sending OTP to ${testPhone}...`);
    const result = await msg91Service.sendOTP(testPhone);
    console.log('Send Result:', JSON.stringify(result, null, 2));

    console.log('Testing Verify OTP (with dummy code)...');
    const verifyResult = await msg91Service.verifyOTP(testPhone, '123456');
    console.log('Verify Result (should be false):', verifyResult);
  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

test();
