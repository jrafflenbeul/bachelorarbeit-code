import * as chrono from "chrono-node";
import parsePrice from "parse-price";
import { subtractISODates } from "./helperFunctions";

export const sanitizeDate = (date) => chrono.parseDate(date)?.toISOString();

export const sanitizePrice = (price) => parsePrice(price);

export const sanitizeData = (data) => {
  let dataCopy = data;
  let sanitizedJsonObject = [];
  dataCopy.forEach((container) => {
    let jsonData = JSON.parse(container.text);
    const keys = Object.keys(jsonData);
    keys.forEach((key) => {
      jsonData[key].forEach((item) => {
        item["price"] = sanitizePrice(item["price"]);
        item["sold"] = sanitizeDate(item["sold"]);
        item["startdate"] = sanitizeDate(item["startdate"]);
        item["delta"] = subtractISODates(item["startdate"], item["sold"]);
      });
    });
    sanitizedJsonObject.push(jsonData);
  });
  return sanitizedJsonObject;
};
