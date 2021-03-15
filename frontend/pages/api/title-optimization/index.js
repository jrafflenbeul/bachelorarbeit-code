import axios from "axios";
import { buildEndpointForSearchResults } from "../../../src/util/functions/ebayEndpointBuilder";

export default async (req, res) => {
  const { method } = req;
  switch (method) {
    case "POST":
      const { itemSummaries } = req.body;
      try {
        const {
          data: { histogram, labels, values },
        } = await axios.post(
          "http://localhost:5000/title-optimization",
          {
            itemSummaries,
          }
        );
        const sanitizedHistogram = "data:image/png;base64," + histogram;
        res.statusCode = 200;
        res.json({
          histogram: sanitizedHistogram,
          histogramLabels: labels,
          histogramValues: values,
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
