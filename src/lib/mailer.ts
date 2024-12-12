import { EmailTemplate } from "@/components/EmailTemplate";
import resend from "./resend";

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${
    process.env.APP_URL
  }/reset-password?token=${encodeURIComponent(token)}`;

  const { data, error } = await resend.emails.send({
    from: "SmartTherapy Security <security@smarttherapy.io>",
    to: [email],
    subject: "Password reset request",
    react: EmailTemplate({ resetLink }),
  });

  if (error) {
    console.error(error);
    return null;
  }
  return data;
}
