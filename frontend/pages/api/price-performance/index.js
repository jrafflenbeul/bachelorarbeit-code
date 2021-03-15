import axios from "axios";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

export default async (req, res) => {
  const { method } = req;
  switch (method) {
    case "POST":
      const { fetchedEbayApiData } = req.body;
      try {
        const {
          data: { image, html, correlations },
        } = await axios.post(
          "http://localhost:5000/price-performance",
          {
            fetchedEbayApiData,
          }
        );

        const parsedCorrelations = JSON.parse(correlations);

        const sanitizedPlotImage = "data:image/png;base64," + image;

        res.statusCode = 200;
        res.json({
          base64: sanitizedPlotImage,
          html,
          correlations: parsedCorrelations,
        });
      } catch (error) {
        console.log(error);
        res.statusCode = 500;
        res.send(error);
      }
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).send(`Method ${method} Not Allowed`);
      break;
  }
};
