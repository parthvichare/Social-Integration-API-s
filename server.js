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
        scope : 'business_management,ads_read,ads_accounts,ads_management,pages_show_list,pages_manage_ads,pages_read_engagement,read_insights,pages_read_user_content,pages_manage_posts,pages_messaging',
    })

    const authUrl = `${baseURL}?${params.toString()}`;

    res.redirect(authUrl);
})




// // Facebook OAuth callback route
// app.get('/auth/facebook/callback', async (req, res) => {
//     console.log('Callback Query Params:', req.query);
//     const { code } = req.query;
//     const tokenUrl = `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`;
//     const params={
//         client_id : process.env.FACEBOOK_APP_ID,
//         redirect_uri : process.env.FACEBOOK_REDIRECT_URI,
//     }
//     try {
//         const response = await axios.get(tokenUrl);
//         const accessToken = response.data.access_token;

//         // Store access token in session
//         req.session.accessToken = accessToken;

//         // Fetch user pages
//         const pages = await fetchUserPages(accessToken);
//         res.json(pages);
//     } catch (error) {
//         console.error('Error during Facebook authentication:', error);
//         res.status(500).send('Error during authentication');
//     }
// });


// Facebook OAuth callback route
// app.get('/auth/facebook/callback', async (req, res) => {
//     console.log('Callback Query Params:', req.query);
//     const { code } = req.query;
//     // const Url = `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`;
    
//     const Url = "https://graph.facebook.com/v16.0/oauth/access_token?"
//     const params={  
//         client_id : process.env.FACEBOOK_APP_ID,
//         redirect_uri : process.env.FACEBOOK_REDIRECT_URI,
//         client_secret : process.env.FACEBOOK_APP_SECRET,
//         code: code
//     }
//     try {
//         const response = await axios.get(Url,{params});
//         const accessToken = response.data.access_token;

//         // Store access token in session
//         req.session.accessToken = accessToken;

//         // Fetch user pages
//         const pages = await fetchUserPages(accessToken);
//         res.json(pages);
//     } catch (error) {
//         console.error('Error during Facebook authentication:', error);
//         res.status(500).send('Error during authentication');
//     }
// });


app.get('/auth/facebook/callback', async (req, res) => {
    console.log('Callback Query Params:', req.query);
    const { code } = req.query;
    const Url = "https://graph.facebook.com/v16.0/oauth/access_token?";
    const params = {
        client_id: process.env.FACEBOOK_APP_ID,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        code: code
    };

    try {
        const response = await axios.get(Url, { params });
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

async function fetchUserPages(accessToken) {
    const response = await axios.get('https://graph.facebook.com/v16.0/me/businesses', {
        params: {
            access_token: accessToken,
            fields: 'id,name,access_token,category'
        }
    });
    return response.data;
}



app.get("/app/:pageId/posts", async(req,res)=>{
    try{
        //Temproray Storage
        const pageId =  req.params.pageId
        // const pageId = "101284292608126" 
        const token =process.env.ACCESS_TOKEN
        const Url = `/${pageId}/posts?`
        const headers = {
            "Authorization" : `Bearer ${token}`,
            "Content-type"  : 'application/json',
        } 
        const response = await axiosInstance.get(Url,{headers})
        res.status(200).json(response.data)
    }catch(error){
        console.log(error.message)
    }
})


app.get("/app/:pageId/insights",async(req,res)=>{
    try{
        const pageId = req.params.pageId
        const token = process.env.ACCESS_TOKEN
        const Url = `/${pageId}/insights?metrics`
        const params = {
            scope: "post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total",
        }
        const headers = {
            "Authorization" : `Bearer ${token}`,
            "Content-type" : 'application/json'
        }
        const response =  await axiosInstance.get(Url,{headers,params})
        res.status(200).json(response.data)
    }catch(error){
        console.log(error.message)
    }
})


// //Page Posts Metrics
// app.get("/app/:page-post-id/insights", async(req,res)=>{
//     try{

//     }
// })





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