const EbayAuthToken = require("ebay-oauth-nodejs-client");
require("dotenv").config();

export default async (req, res) => {
  const { method } = req;
  const ebayAuthToken = new EbayAuthToken({
    clientId: process.env.EBAY_APP_ID,
    clientSecret: process.env.EBAY_APP_SECRET,
    redirectUri: process.env.EBAY_API_REDIRECT_URI,
  });
  switch (method) {
    case "GET":
      const userAuthorizationUrl = await ebayAuthToken.generateUserAuthorizationUrl(
        "PRODUCTION",
        "https://api.ebay.com/oauth/api_scope"
      );
      res.json(userAuthorizationUrl);
      res.end();
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).send(`Method ${method} Not Allowed`);
  }
};
