import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioConfigured = !!(accountSid && authToken && twilioPhoneNumber);

const client = twilioConfigured ? twilio(accountSid, authToken) : null;

export interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SMSOptions): Promise<boolean> {
  if (!client) {
    console.warn('Twilio not configured. SMS not sent. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable SMS.');
    return false;
  }
  
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber!,
      to: to
    });

    console.log(`SMS sent successfully. SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

export async function sendOTPSMS(mobileNumber: string, otp: string): Promise<boolean> {
  const message = `Your RyteFit verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
  
  return await sendSMS({
    to: mobileNumber,
    message
  });
}