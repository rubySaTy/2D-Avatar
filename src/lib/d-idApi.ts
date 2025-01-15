import axios from "axios";
import axiosRetry from "axios-retry";

const didApi = axios.create({
  baseURL: `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}`,
  headers: {
    Authorization: `Basic ${process.env.DID_API_KEY}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosRetry(didApi, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkError(error) ||
      axiosRetry.isRetryableError(error) ||
      error.response?.status === 429 // Rate limit exceeded
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(
      `Retry attempt ${retryCount} for ${requestConfig.method} ${requestConfig.url}`,
      error.message
    );
  },
});

export default didApi;
