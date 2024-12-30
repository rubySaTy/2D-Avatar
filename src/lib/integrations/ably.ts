import Ably from "ably";

const key = process.env.ABLY_API_KEY;
if (!key) throw new Error("Missing ABLY_API_KEY");

export const ablyRest = new Ably.Rest({ key });
