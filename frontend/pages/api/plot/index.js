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
      const { fetchedEbayApiData, adType } = req.body;
      try {
        const {
          data: { image, zoomedimage, ets, eps },
        } = await axios.post("http://localhost:5000/plot-data", {
          fetchedEbayApiData,
          adType,
        });
        const sanitizedPlotImage = "data:image/png;base64," + image;
        const sanitizedZoomedPlotImage = "data:image/png;base64," + zoomedimage;
        res.statusCode = 200;
        res.json({
          base64: sanitizedPlotImage,
          zoomedBase64: sanitizedZoomedPlotImage,
          ets,
          eps,
        });
      } catch (error) {
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
