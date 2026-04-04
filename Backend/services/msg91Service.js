// const axios = require('axios');

// const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
// const MSG91_OTP_TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID;

// /**
//  * Send OTP via MSG91 (Direct API)
//  * @param {string} phoneNumber - 10 digit phone number
//  * @param {string} channel - 'sms' or 'whatsapp'
//  * @returns {Promise}
//  */
// exports.sendOTP = async (phoneNumber, channel = 'sms') => {
//   try {
//     // API Documentation: https://docs.msg91.com/otp/send-otp
//     const response = await axios.get(`https://control.msg91.com/api/v5/otp`, {
//       params: {
//         template_id: MSG91_OTP_TEMPLATE_ID,
//         mobile: `91${phoneNumber}`,
//         authkey: MSG91_AUTH_KEY,
//         channel: channel === 'whatsapp' ? 'whatsapp' : 'sms',
//         otp_length: 6 // Matching your dashboard configuration
//       }
//     });
//     return response.data;
//   } catch (error) {
//     console.error('MSG91 Send OTP Error:', error.response ? error.response.data : error.message);
//     throw new Error('Failed to send OTP via MSG91');
//   }
// };

// /**
//  * Verify OTP via MSG91 (Direct API)
//  * @param {string} phoneNumber - 10 digit phone number
//  * @param {string} otp - The OTP to verify
//  * @returns {Promise}
//  */
// exports.verifyOTP = async (phoneNumber, otp) => {
//   try {
//     // API Documentation: https://docs.msg91.com/otp/verify-otp
//     const response = await axios.get(`https://control.msg91.com/api/v5/otp/verify`, {
//       params: {
//         otp: otp,
//         mobile: `91${phoneNumber}`,
//         authkey: MSG91_AUTH_KEY
//       }
//     });
//     // Response type "success" means OTP is correct
//     return response.data.type === 'success';
//   } catch (error) {
//     console.error('MSG91 Verify OTP Error:', error.response ? error.response.data : error.message);
//     return false;
//   }
// };

// /**
//  * Send WhatsApp Notification (Order Status Updates)
//  */
// exports.sendWhatsAppNotification = async (phoneNumber, templateId, variables) => {
//   try {
//     const response = await axios.post(`https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/`, {
//       integrated_number: process.env.MSG91_WHATSAPP_NUMBER,
//       content_type: "template",
//       payload: {
//         messaging_product: "whatsapp",
//         type: "template",
//         template: {
//           name: templateId,
//           language: { code: "en" },
//           components: [
//             {
//               type: "body",
//               parameters: Object.entries(variables).map(([key, value]) => ({
//                 type: "text",
//                 text: value
//               }))
//             }
//           ]
//         }
//       },
//       to: `91${phoneNumber}`
//     }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'authkey': MSG91_AUTH_KEY
//       }
//     });
//     return response.data;
//   } catch (error) {
//     console.error('MSG91 WhatsApp Notification Error:', error.response ? error.response.data : error.message);
//     throw new Error('Failed to send WhatsApp notification');
//   }
// };

// /**
//  * Legacy Support for Access Token verification
//  * (Keep this just to avoid breaking old JWT code if any persists)
//  */
// exports.verifyAccessToken = async (accessToken) => {
//   try {
//     const response = await axios.post(`https://control.msg91.com/api/v5/widget/verifyAccessToken`, {
//       "authkey": MSG91_AUTH_KEY,
//       "access-token": accessToken
//     });
//     return response.data;
//   } catch (error) {
//     return { type: 'error' };
//   }
// };
