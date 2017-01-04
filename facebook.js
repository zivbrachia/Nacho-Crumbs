function getUserProfile(userId) {
    // https://graph.facebook.com/v2.6/<USER_ID>?access_token=PAGE_ACCESS_TOKEN
    let pageAddress = "https://graph.facebook.com/v2.6/" + userId + "?access_token=" + process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    return pageAddress;
}

module.exports = {getUserProfile};

