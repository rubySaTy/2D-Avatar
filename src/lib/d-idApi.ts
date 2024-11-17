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
