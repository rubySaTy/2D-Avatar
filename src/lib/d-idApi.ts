import axios from "axios";

const didApi = axios.create({
  baseURL: `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}`,
  headers: {
    Authorization: `Basic ${process.env.DID_API_KEY}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default didApi;

// TODO: add retry mechanism to axios requests?
// async function fetchWithRetries<T>(
//   url: string,
//   config: AxiosRequestConfig = {},
//   pollConfig: PollConfig<T>
// ): Promise<AxiosResponse<T>> {
//   const { maxRetries, initialRetryDelay, maxRetryDelay, shouldRetry } = pollConfig;

//   for (let attempt = 0; attempt < maxRetries; attempt++) {
//     try {
//       const response = await didApi<T>(url, config);

//       if (!shouldRetry(response.data)) {
//         return response;
//       }

//       const delay = Math.min(initialRetryDelay * Math.pow(2, attempt), maxRetryDelay);

//       console.warn(
//         `Status not yet 'done', retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`
//       );
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     } catch (error) {
//       if (attempt === maxRetries - 1) {
//         throw error;
//       }

//       const delay = Math.min(initialRetryDelay * Math.pow(2, attempt), maxRetryDelay);

//       console.warn(
//         `Request failed, retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`
//       );
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }

//   throw new Error("Max retries reached without achieving desired status");
// }
