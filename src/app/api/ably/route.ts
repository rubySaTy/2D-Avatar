import { NextResponse } from "next/server";
import { ablyRest } from "@/lib/integrations/ably";
import { getUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const tokenRequest = await ablyRest.auth.createTokenRequest({
      clientId: user.id,
    });

    return Response.json(tokenRequest);
  } catch (error) {
    console.error("Error creating Ably token:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
