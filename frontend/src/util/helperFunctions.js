import { APPLE_NOTEBOOK, VIDEO_GAME_CONSOLE } from "./constants/categoryIds";
import extractNumbers from "extract-numbers";
import { resolveHref } from "next/dist/next-server/lib/router/router";

export const isJSON = (jsonString) => {
  try {
    if (jsonString && typeof jsonString === "object") {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
};

export const isFile = (file) => typeof file.name == "string";

export const subtractISODates = (isoStartDate, isoEndDate) => {
  const startDate = new Date(isoStartDate);
  const endDate = new Date(isoEndDate);
  var time_diff = endDate.getTime() - startDate.getTime();
  var delta = time_diff / (1000 * 3600 * 24);
  return Math.abs(delta);
};

export const getAuctionItems = (data) => {
  let dataCopy = data;
  let sanitizedJsonObject = [];
  dataCopy.forEach((container) => {
    let jsonData = JSON.parse(container.text);
    const keys = Object.keys(jsonData);
    keys.forEach((key) => {
      jsonData[key].forEach((item, i) => {
        if (item["auction"] === true) {
          jsonData[key].splice(i, 1);
        }
      });
    });
    sanitizedJsonObject.push(jsonData);
  });
  return sanitizedJsonObject;
};

export const getBuyItNowItems = (data) => {
  data.forEach((container) => {
    let jsonData = JSON.parse(container.text);
    const keys = Object.keys(jsonData);
    keys.forEach((key) => {
      return jsonData[key].find(
        (item) => item["auction"] === false || !item["auction"]
      );
    });
  });
};

export const filterByCategoryId = (items, device) => {
  return new Promise(function (resolve, reject) {
    let categoryId = "";
    switch (device) {
      case "nintendoswitch":
        categoryId = VIDEO_GAME_CONSOLE;
        break;
      case "ps4":
        categoryId = VIDEO_GAME_CONSOLE;
        break;
      case "macbook":
        categoryId = APPLE_NOTEBOOK;
        break;
      case "macbook2017":
        categoryId = APPLE_NOTEBOOK;
        break;
    }
    if (categoryId) {
      const filteredItems = items.filter(
        (item) => item["PrimaryCategoryID"] === categoryId
      );
      resolve(filteredItems);
    } else {
      reject("No category ID defined!");
    }
  });
};

export const shortenedItemData = (items) => {
  return new Promise(function (resolve, reject) {
    let shortenedItems = [];
    try {
      items.forEach((item) => {
        const {
          ItemSpecifics: { NameValueList },
          StartTime,
          EndTime,
          ItemID,
          ListingType,
          PrimaryCategoryID,
          CurrentPrice,
          ListingStatus,
        } = item;
        const shortenedItem = {
          Specifics: NameValueList,
          StartTime,
          EndTime,
          ItemID,
          ListingType,
          PrimaryCategoryID,
          CurrentPrice,
          ListingStatus,
        };
        shortenedItems.push(shortenedItem);
      });
      if (shortenedItems.length > 0) {
        resolve(shortenedItems);
      } else {
        reject("Array empty");
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const removeNonNumericalValuesFromSpecifics = (items) => {
  const filteredItemsWithNumericalValuesOnly = items.map((item, i) => {
    if (item["Specifics"]) {
      let itemCopy = item;
      let specificsCopy = [...item["Specifics"]];
      const filteredSpecifics = specificsCopy.filter((specific) => {
        if (specific.value !== undefined) {
          return !Array.isArray(specific.value);
        }
      });
      itemCopy = { ...item, Specifics: filteredSpecifics };
      return itemCopy;
    }
  });
  return filteredItemsWithNumericalValuesOnly;
};

export const preprocessFeatures = (items) => {
  let preprocessedItems = [];
  return new Promise(function (resolve, reject) {
    try {
      items.forEach((item) => {
        let itemCopy = item;
        item["Specifics"].forEach((specific, i) => {
          if (specific["Value"]) {
            const extractedNumberValue = extractNumbers(specific["Value"][0]);
            if (extractedNumberValue && extractedNumberValue?.length > 0) {
              let specificCopy = specific;
              specificCopy = {
                name: specific["Name"],
                value: extractedNumberValue[0],
              };
              itemCopy["Specifics"][i] = specificCopy;
            }
          }
        });
        if (itemCopy) preprocessedItems.push(itemCopy);
      });
      const onlyNumericalSpecifics = removeNonNumericalValuesFromSpecifics(
        preprocessedItems
      );
      console.log(onlyNumericalSpecifics);
      if (preprocessedItems.length > 0) {
        resolve(onlyNumericalSpecifics);
      } else {
        reject("Array empty");
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const filterByAdType = (items, adType) => {
  return new Promise(function (resolve, reject) {
    if (adType === "FixedPriceItem" || adType === "Chinese") {
      try {
        let itemsCopy = items;
        const filteredData = items[0].data.filter(
          (item) => item["ListingType"] === adType
        );
        itemsCopy[0].data = filteredData;
        resolve(itemsCopy);
      } catch (error) {
        reject(error);
      }
    } else {
      resolve(items);
    }
  });
};

export const sanitizeCorrelationTitle = (title) => {
  let sanitizedTitle = title.replace("(", "");
  sanitizedTitle = sanitizedTitle.replace(")", "");
  sanitizedTitle = sanitizedTitle.replaceAll("'", "");
  sanitizedTitle = sanitizedTitle.replaceAll(" ", "");
  const splittedTitle = sanitizedTitle.split(",");
  return splittedTitle[0] + " - " + splittedTitle[1];
};

export const getTop5Correlations = (data, direction) => {
  switch (direction) {
    case "asc":
      data.sort((a, b) => {
        if (a.value < b.value) return 1;
        if (a.value > b.value) return -1;
        return 0;
      });
      break;
    case "desc":
      data.sort((a, b) => {
        if (a.value < b.value) return -1;
        if (a.value > b.value) return 1;
        return 0;
      });
      break;
    default:
      // desc
      data.sort((a, b) => {
        if (a.value < b.value) return -1;
        if (a.value > b.value) return 1;
        return 0;
      });
      break;
  }
  return data.slice(0, 5);
};

export const getTop5PriceCorrelations = (data, direction) => {
  switch (direction) {
    case "asc":
      data.sort((a, b) => {
        if (a.value < b.value) return 1;
        if (a.value > b.value) return -1;
        return 0;
      });
      break;
    case "desc":
      data.sort((a, b) => {
        if (a.value < b.value) return -1;
        if (a.value > b.value) return 1;
        return 0;
      });
      break;
    default:
      // desc
      data.sort((a, b) => {
        if (a.value < b.value) return -1;
        if (a.value > b.value) return 1;
        return 0;
      });
      break;
  }
  return data.filter((elem) => elem.corr.includes("USD")).slice(0, 5);
};

export const createExampleTitle = (rootTitle, histogramLabels) => {
  let exampleTitle = rootTitle;
  let exampleWords = [];
  histogramLabels.forEach((label) => {
    if (
      !exampleTitle.toLowerCase().includes(label.toLowerCase()) &&
      exampleTitle.length + label.length < 80
    ) {
      exampleTitle = exampleTitle.concat(" ");
      exampleTitle = exampleTitle.concat(label);
      exampleWords.push(label);
    }
  });
  return { exampleTitle, exampleWords };
};
