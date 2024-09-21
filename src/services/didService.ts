export class DIDService {
  static async createStream(sourceUrl: string) {
    const response = await fetch(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_url: sourceUrl,
          stream_warmup: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`D-ID API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Add methods for handling other D-ID API interactions as needed
}
