const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const axiosBackendInstance = axios.create({
  baseURL: process.env.MERCURY_BACKEND_ENDPOINT,
  headers: {
    Authorization: `Bearer ${process.env.MERCURY_ACCESS_TOKEN} `,
  },
});

const axiosGraphqlInstance = axios.create({
  baseURL: `${process.env.MERCURY_GRAPHQL_ENDPOINT}/graphql`,
  headers: {
    Authorization: `Bearer ${process.env.MERCURY_ACCESS_TOKEN} `,
  },
});

module.exports = {
  axiosBackendInstance,
  axiosGraphqlInstance,
};
