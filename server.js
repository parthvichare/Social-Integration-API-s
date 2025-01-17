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
        scope : 'business_management,ads_read,ads_management,pages_show_list,pages_manage_ads,pages_read_engagement,read_insights,pages_read_user_content,pages_manage_posts,pages_messaging',
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
        // req.session.category =  category;
        // req.session

        // Fetch user pages
        const generate_pagesId  = await generatePagesId(accessToken)
        const generate_businessId = await generateBusinessId(accessToken);
        // const generate_AdaccountId = await generateAdsAccountId(accessToken)
        const generateAdsAccountId = await adsAccountdetail(accessToken)
        const page = generate_pagesId.data[0]
        const business = generate_businessId.data[0]
        // const adaccount = generateAdsAccountId

        res.json({
            pageId:page.id,
            pageName: page.name,
            accessToken:accessToken,
            businessId:business.id,
            businessCategory: business.name,
            adAccountId:generateAdsAccountId.id,
            adAccountNumber:generateAdsAccountId.account_id,
            adaccountName: generateAdsAccountId.name,
            all_info:generate_pagesId.data
        });
    } catch (error) {
        console.error('Error during Facebook authentication:', error);
        res.status(500).send('Error during authentication');
    }
});

async function generateBusinessId(accessToken) {
    const response = await axios.get('https://graph.facebook.com/v16.0/me/businesses?', {
        params: {
            access_token: accessToken,
            fields: 'id,name,access_token,category,promoted_object'
        }

    });
    return response.data;
}


async function generatePagesId(accessToken) {
    const response = await axiosInstance.get(`/me/accounts?`, {
        params: {
            access_token: accessToken,
        }
    });
    return response.data;
}



async function adsAccountdetail(accessToken){
    const generate_AdaccountId = await generateAdsAccountId(accessToken)
    if (!generate_AdaccountId || !generate_AdaccountId.data || generate_AdaccountId.data.length === 0) {
        throw new Error('No ad accounts found.');
    }
    const adaccountId = generate_AdaccountId.data[0];
    console.log("Account details",adaccountId)
    const response = await axiosInstance.get(`/act_${adaccountId.account_id}`,{
        params:{
            access_token:accessToken,
            fields:'name,account_id'
        }
    })
    return response.data
}

async function generateAdsAccountId(accessToken){
    const response = await axiosInstance.get("/me/adaccounts",{
        params:{
            access_token:accessToken,
        }
    })
    return response.data
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


app.get("/app/:postId/insights",async(req,res)=>{
    try{
        const postId = req.params.postId
        const token = process.env.ACCESS_TOKEN
        const Url = `/${postId}/insights`
        const params = {
            metric: "post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total,post_impressions_unique"
        }
        const headers = {
            "Authorization" : `Bearer ${token}`,
            "Content-type" : 'application/json'
        }
        const response =  await axiosInstance.get(Url,{headers,params})
        res.status(200).json(response.data)
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to fetch insights" });
    }
})



//Create & Managing AdsCampaign




// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});