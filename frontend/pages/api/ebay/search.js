import axios from "axios";
const EbayAuthToken = require("ebay-oauth-nodejs-client");
require("dotenv").config();

export default async (req, res) => {
  const { method } = req;

  const { code, searchTerm } = req.body;

  const ebayAuthToken = new EbayAuthToken({
    clientId: process.env.EBAY_APP_ID,
    clientSecret: process.env.EBAY_APP_SECRET,
    redirectUri: process.env.EBAY_API_REDIRECT_URI,
  });

  switch (method) {
    case "POST":
      try {
        const tokenString = await ebayAuthToken.exchangeCodeForAccessToken(
          "PRODUCTION",
          code
        );
        const token = JSON.parse(tokenString);
        console.log(token);
        const order = await axios.get(
          `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${searchTerm}`,
          {
            headers: {
              Authorization: `Bearer ${token.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(order);

        const orderdata = order.data;
        res.statusCode = 200;
        res.json({ orderdata });
      } catch (error) {
        res.status = 500;
        res.send(error);
      }
      break;
    default:
      res.status(405).send(`Method ${method} Not Allowed`);
  }
};
