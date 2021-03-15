import React, { useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Tag,
  Card,
  Table,
  Button,
  Space,
  Select,
  Alert,
} from "antd";
import axios from "axios";
import {
  filterByCategoryId,
  shortenedItemData,
  isFile,
  preprocessFeatures,
  filterByAdType,
  sanitizeCorrelationTitle,
  getTop5Correlations,
  getTop5PriceCorrelations,
} from "../src/util/helperFunctions";
import Selector from "../components/Selector";
import CustomizedTable from "../components/CustomizedTable";

const PricePerformanceRatio = () => {
  const [JSONList, setJSONList] = useState([]);
  const [itemsContainer, setItemsContainer] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adType, setAdType] = useState("");
  const [correlationTableSource, setCorrelationTableSource] = useState([]);
  const [top5Order, setTop5Order] = useState("asc");
  const [top5Correlations, setTop5Correlations] = useState([]);

  const breakpoints = Grid.useBreakpoint();

  useEffect(() => {
    if (JSONList[0]?.correlations) {
      console.log(JSONList[0]?.correlations);
      let correlationTableSourceCopy = [...correlationTableSource];
      correlationTableSourceCopy = Object.entries(JSONList[0].correlations).map(
        (entry, i) => {
          const sanitizedCorrelationTitle = sanitizeCorrelationTitle(entry[0]);
          return { key: i, corr: sanitizedCorrelationTitle, value: entry[1] };
        }
      );
      setCorrelationTableSource(correlationTableSourceCopy);
    }
  }, [JSONList]);

  const readJSON = async (file, i = -1) => {
    if (isFile(file)) {
      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onloadend = () => {
        let textCopy = [...itemsContainer];
        textCopy.push({
          id: i,
          text: reader.result,
          contentViewable: true,
        });
        setItemsContainer(textCopy);
      };
    } else if (i === -1) {
      let textCopy = [...itemsContainer];
      textCopy.push({
        id: textCopy.length,
        text: JSON.stringify(file),
        contentViewable: true,
      });
      setItemsContainer(textCopy);
    } else {
      setItemsContainer([
        ...itemsContainer,
        {
          id: i,
          text: JSON.stringify(file),
          contentViewable: true,
        },
      ]);
    }
  };

  const loadTestDataDirectly = async (value) => {
    setIsLoading(true);
    let data, device, name;
    switch (value) {
      case "macbook2017":
        const { data: macbook2017Data } = await axios.get(
          "https://ebay-analysis-tool.vercel.app/macbook2017.json"
        );
        data = macbook2017Data;
        device = "macbook2017";
        name = "MacBook (Baujahr 2017)";
        break;
      case "macbook":
        const { data: macbookData } = await axios.get(
          "https://ebay-analysis-tool.vercel.app/macbook.json"
        );
        data = macbookData;
        device = "macbook";
        name = "MacBook";
        break;
      case "nintendoswitch":
        const { data: nintendoSwitchData } = await axios.get(
          "https://ebay-analysis-tool.vercel.app/nintendoswitch.json"
        );
        data = nintendoSwitchData;
        device = "nintendoswitch";
        name = "Nintendo Switch";
        break;
      case "ps4":
        const { data: ps4Data } = await axios.get(
          "https://ebay-analysis-tool.vercel.app/ps4.json"
        );
        data = ps4Data;
        device = "ps4";
        name = "PlayStation 4";
        break;
    }
    let JSONListCopy = [...JSONList];
    JSONListCopy.push({
      html: "",
      data,
      device,
      name,
    });
    setJSONList(JSONListCopy);
    readJSON(data);
    setIsLoading(false);
  };

  const evaluateData = async () => {
    setIsEvaluating(true);
    setCorrelationTableSource([]);
    setTop5Order("asc");
    setTop5Correlations([]);
    let JSONListCopy = [...JSONList];
    let dataClone = JSONList[0].data;
    const itemDataFilteredByAdType = await filterByAdType(JSONList, adType);
    for (const item of itemDataFilteredByAdType) {
      const { data: fetchedEbayApiData, device } = item;
      const itemDataFilteredByCategoryId = await filterByCategoryId(
        fetchedEbayApiData,
        device
      );
      const shortenedItemDataset = await shortenedItemData(
        itemDataFilteredByCategoryId
      );
      const featureScaledItems = await preprocessFeatures(shortenedItemDataset);
      const {
        data: { base64, html, correlations },
      } = await axios.post("/api/price-performance", {
        fetchedEbayApiData: featureScaledItems,
        adType,
      });
      JSONListCopy[0] = {
        ...JSONListCopy[0],
        data: dataClone,
        image: base64,
        html,
        correlations,
      };
      setJSONList(JSONListCopy);
    }
    setIsEvaluating(false);
  };

  const onAdTypeChange = (value) => {
    setAdType(value);
  };

  return (
    <>
      <Typography.Title level={1}>Price-Performance Ratio</Typography.Title>
      <Space direction="vertical">
        <Alert
          type="warning"
          message="Diese Funktion steht nur im lokalen Serverbetrieb zur Verfügung"
        />
        {isLoading && (
          <Tag color="yellow">
            Testdaten werden eingeladen. Dies kann einen Moment dauern.
          </Tag>
        )}
        <Selector
          {...{
            JSONList,
            loadTestDataDirectly,
            onAdTypeChange,
            isEvaluating,
            isLoading,
            evaluateData,
            adType,
            breakpoints,
          }}
        />
      </Space>
      {JSONList[0] && (
        <Card
          cover={<img src={JSONList[0].image} />}
          style={{ maxWidth: "100%" }}
        >
          <Space
            direction="vertical"
            style={{ width: "100%", maxWidth: "100%" }}
          >
            {correlationTableSource.length > 0 && (
              <>
                <Space direction="horizontal">
                  <Select
                    defaultValue={top5Order}
                    value={top5Order}
                    onChange={(value) => setTop5Order(value)}
                  >
                    <Select.Option value="asc">Aufsteigend</Select.Option>
                    <Select.Option value="desc">Absteigend</Select.Option>
                  </Select>
                  <Button
                    type="primary"
                    onClick={() =>
                      setTop5Correlations(
                        getTop5PriceCorrelations(
                          correlationTableSource,
                          top5Order
                        )
                      )
                    }
                  >
                    Top 5 Preiskorrelationen
                  </Button>
                  <Button
                    type="dashed"
                    onClick={() =>
                      setTop5Correlations(
                        getTop5Correlations(correlationTableSource, top5Order)
                      )
                    }
                  >
                    Top 5 Korrelationen
                  </Button>
                </Space>
                {top5Correlations.length > 0 &&
                  top5Correlations.map((correlation) => (
                    <>
                      <Typography.Paragraph>
                        {correlation.corr}: {correlation.value}
                      </Typography.Paragraph>
                    </>
                  ))}
              </>
            )}
            <CustomizedTable {...{ correlationTableSource }} />
            <div
              dangerouslySetInnerHTML={{ __html: JSONList[0].html }}
              style={{ maxWidth: "100%" }}
            />
          </Space>
        </Card>
      )}
    </>
  );
};

export default PricePerformanceRatio;
