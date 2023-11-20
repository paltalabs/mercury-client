import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const axiosBackendInstance = axios.create({
  baseURL: process.env.MERCURY_BACKEND_ENDPOINT,
  headers: {
    Authorization: `Bearer ${process.env.MERCURY_ACCESS_TOKEN} `,
  },
});

export const axiosGraphqlInstance = axios.create({
  baseURL: `${process.env.MERCURY_GRAPHQL_ENDPOINT}/graphql`,
  headers: {
    Authorization: `Bearer ${process.env.MERCURY_ACCESS_TOKEN} `,
  },
});
