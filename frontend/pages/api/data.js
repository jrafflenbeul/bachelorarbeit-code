import axios from "axios";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

export default async (req, res) => {
  const {
    body,
    headers: { host },
  } = req;

  const ids = [];
  const items = [];

  Object.entries(body).forEach(([key, val]) =>
    ids.push(...val.map((el) => (el = el.id)))
  );

  await Promise.all(
    ids.map(async (id) => {
      try {
        const {
          data: { item },
        } = await axios.get(`http://${host}/api/items/${id}`);
        items.push(item);
      } catch (error) {
        console.error(error);
      }
    })
  );

  console.log(`retrieved ${items.length} out of ${ids.length}`);
  res.json(items);
};
