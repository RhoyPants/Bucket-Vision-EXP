import axios from "axios";

const AIMS_EMAIL_URL = "https://aims-api-staging.globalvisionsinc.com.ph/api/send/email";

export interface SendEmailPayload {
  to: string;
  subject: string;
  message: string;
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
  const response = await axios.post<SendEmailResponse>(AIMS_EMAIL_URL, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
}
