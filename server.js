// server.js

const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const axiosInstance = require('./axiosInstance');

dotenv.config();

const app = express();
const port = 3000;


console.log('Facebook App ID:', process.env.FACEBOOK_APP_ID);
console.log('Facebook App Secret:', process.env.FACEBOOK_APP_SECRET);
console.log('Facebook Redirect URI:', process.env.FACEBOOK_REDIRECT_URI);


// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

// // Facebook OAuth login route
// app.get('/auth/facebook', (req, res) => {
//     const authUrl = `
//     https://www.facebook.com/v16.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=pages_show_list,pages_manage_ads,pages_read_engagement,read_insights`;
//     // pages_read_engagement,read_insights
//     res.redirect(authUrl);
// });

app.get('/auth/facebook', (req,res)=>{
    const baseURL = 'https://www.facebook.com/v16.0/dialog/oauth';

    const params = new URLSearchParams({
        client_id : process.env.FACEBOOK_APP_ID,
        redirect_uri : process.env.FACEBOOK_REDIRECT_URI,
        scope : 'pages_show_list,pages_manage_ads,pages_read_engagement,read_insights',
    })

    const authUrl = `${baseURL}?${params.toString()}`;

    res.redirect(authUrl);
})


// Facebook OAuth callback route
app.get('/auth/facebook/callback', async (req, res) => {
    console.log('Callback Query Params:', req.query);
    const { code } = req.query;
    const tokenUrl = `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`;

    try {
        const response = await axios.get(tokenUrl);
        const accessToken = response.data.access_token;

        // Store access token in session
        req.session.accessToken = accessToken;

        // Fetch user pages
        const pages = await fetchUserPages(accessToken);
        res.json(pages);
    } catch (error) {
        console.error('Error during Facebook authentication:', error);
        res.status(500).send('Error during authentication');
    }
});

// Function to fetch user Pages
async function fetchUserPages(accessToken) {
    const response = await axiosInstance.get(`/me/accounts`, {
        params: {
            access_token: accessToken
        }
    });
    return response.data;
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});