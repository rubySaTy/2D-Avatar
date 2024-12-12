interface ResetPasswordEmailProps {
  resetLink: string;
}

export const EmailTemplate: React.FC<Readonly<ResetPasswordEmailProps>> = ({
  resetLink,
}) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      maxWidth: "600px",
      margin: "0 auto",
      padding: "20px",
    }}
  >
    <h1>Reset Your Password</h1>
    <p>
      You have requested to reset your password for your account. Click the
      button below to proceed:
    </p>

    <a
      href={resetLink}
      style={{
        display: "inline-block",
        backgroundColor: "#007bff",
        color: "white",
        padding: "10px 20px",
        textDecoration: "none",
        borderRadius: "5px",
        margin: "20px 0",
      }}
    >
      Reset Password
    </a>

    <p>
      If you did not request a password reset, please ignore this email or
      contact support if you have concerns.
    </p>

    <p>This link will expire in 1 hour.</p>

    <div style={{ fontSize: "12px", color: "#777", marginTop: "20px" }}>
      <p>
        © {new Date().getFullYear()} SmartTherapy. All rights reserved.
      </p>
      <p>
        If you're having trouble, copy and paste this link into your browser:{" "}
        {resetLink}
      </p>
    </div>
  </div>
);
