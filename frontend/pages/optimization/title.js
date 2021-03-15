import React, { useEffect, useState } from "react";
import {
  Card,
  Input,
  Typography,
  Button,
  message,
  List,
  Collapse,
  Tag,
  Space,
  Alert,
} from "antd";
import axios from "axios";
import { useRouter } from "next/router";
import Highlighter from "react-highlight-words";
import { createExampleTitle } from "../../src/util/helperFunctions";
import Paragraph from "antd/lib/skeleton/Paragraph";

const Title = () => {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState(router?.query?.code);
  const [authorizationUri, setAuthorizationUri] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [histogram, setHistogram] = useState("");
  const [histogramLabels, setHistogramLabels] = useState([]);
  const [histogramValues, setHistogramValues] = useState([]);
  const [titleExample, setTitleExample] = useState("");
  const [exampleWords, setWordsExample] = useState([]);

  useEffect(() => {
    getAuthorizationUri();
    setCode(router?.query?.code);
  }, []);

  const getAuthorizationUri = async () => {
    const { data: uri } = await axios.get("/api/ebay/authtoken");
    setAuthorizationUri(uri);
  };

  const getSearchResults = async (searchTerm) => {
    setSearchTerm(searchTerm);
    setIsLoading(true);
    if (searchTerm === "") {
      message.warning("Bitte Suchbegriff eingeben");
    } else {
      if (router?.query?.code) {
        const { data: fetchedSearchResults } = await axios.post(
          "/api/ebay/search",
          {
            code: router?.query?.code,
            searchTerm,
          }
        );
        const {
          orderdata: { itemSummaries },
        } = fetchedSearchResults;
        setSearchResults(itemSummaries);

        const {
          data: { histogram, histogramLabels, histogramValues },
        } = await axios.post("/api/title-optimization", {
          itemSummaries,
        });
        setHistogram(histogram);
        setHistogramLabels(histogramLabels);
        setHistogramValues(histogramValues);
        const { exampleTitle, exampleWords } = createExampleTitle(
          searchTerm,
          histogramLabels
        );
        setTitleExample(exampleTitle);
        setWordsExample(exampleWords);
      } else {
        console.log("Code not set");
      }
    }
    setIsLoading(false);
  };

  const getColor = (value) => {
    var hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
  };

  return (
    <>
      <Typography.Title level={1}>Titel Optimierung</Typography.Title>
      <Alert
        type="warning"
        message="Diese Funktion steht nur im lokalen Serverbetrieb zur Verfügung"
      />
      <Card cover={histogram && <img src={histogram} />}>
        <Space direction="vertical" style={{ width: "100%" }}>
          {exampleWords.length > 0 && (
            <>
              <Typography.Paragraph>
                Verglichen mit den Top 50 Inseraten zu dem Suchbegriff{" "}
                <Tag color="processing">{searchTerm}</Tag> sollten folgende
                Wörter/Zeichen im endgültigen Titel enthalten sein:
                <br />
                {exampleWords.map((word, i) => (
                  <Tag
                    color="green"
                    key={i}
                    style={{
                      margin: "0.25em",
                    }}
                  >
                    {word}
                  </Tag>
                ))}
              </Typography.Paragraph>
            </>
          )}
          {titleExample && (
            <Typography.Paragraph>
              Vorschlag: <Tag color="geekblue">{titleExample}</Tag>
            </Typography.Paragraph>
          )}

          {histogramLabels.length > 0 && (
            <Collapse defaultActiveKey={["1"]}>
              <Collapse.Panel header="Word Frequency Histogram" key="1">
                {histogramLabels.map((value, i) => (
                  <Tag
                    key={i}
                    style={{
                      margin: "0.25em",
                    }}
                    icon={
                      <span
                        style={{
                          border: "1px solid black",
                          backgroundColor: "white",
                          color: "black",
                          margin: "0 0.5em 0 0",
                        }}
                      >
                        {histogramValues[i]}
                      </span>
                    }
                    color={getColor(i / histogramLabels.length)}
                  >
                    {value}
                  </Tag>
                ))}
              </Collapse.Panel>
            </Collapse>
          )}
          {!router?.query?.code && (
            <Button href={authorizationUri} type="primary">
              Erzeuge Session
            </Button>
          )}
          {router?.query?.code && (
            <Input.Search
              placeholder="Suchbegriff eingeben"
              onSearch={getSearchResults}
              enterButton
              loading={isLoading}
            />
          )}
        </Space>
      </Card>
      <List
        header={<div>Suchergebnisse</div>}
        bordered
        dataSource={searchResults?.map((result) => result.title)}
        renderItem={(item) => (
          <List.Item>
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
              searchWords={[searchTerm]}
              autoEscape
              textToHighlight={item}
            />
          </List.Item>
        )}
      />
    </>
  );
};

export default Title;
