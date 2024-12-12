import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing Resend configuration in environment variables.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;
