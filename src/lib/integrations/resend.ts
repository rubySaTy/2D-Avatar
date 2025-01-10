import { Resend } from "resend";
import { EmailTemplate } from "@/components/auth/EmailTemplate";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing Resend configuration in environment variables.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${
    process.env.APP_URL
  }/reset-password?token=${encodeURIComponent(token)}`;

  const { data, error } = await resend.emails.send({
    from: "riZolv Security <security@avatar.rizolv.ai>",
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
