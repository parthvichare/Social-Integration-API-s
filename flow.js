//Generate Business Id token
// Where we loginApp to grant All permission

// /me/businesses?

async function generateBusinessId(accessToken) {
    const response = await axios.get('https://graph.facebook.com/v16.0/me/businesses?', {
        params: {
            access_token: accessToken,
            fields: 'id,name,access_token,category'
        }

    });
    return response.data;
}
