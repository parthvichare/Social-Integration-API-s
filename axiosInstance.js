const axios  = require("axios")

const axiosInstance = axios.create({
    baseURL: 'https://graph.facebook.com/v16.0', // Ensure no trailing slash
    timeout: 10000,
});
module.exports= axiosInstance;