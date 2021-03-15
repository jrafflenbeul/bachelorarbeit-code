import React, { useState } from "react";
import {
  Input,
  Typography,
  Button,
  Row,
  Col,
  Divider,
  Space,
  Modal,
  Grid,
  Card,
  Tag,
} from "antd";
import axios from "axios";
import { filterByCategoryId, isFile } from "../src/util/helperFunctions";
import ReactJson from "react-json-view";
import Selector from "../components/Selector";

const Home = () => {
  const [JSONList, setJSONList] = useState([]);
  const [itemsContainer, setItemsContainer] = useState([]);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentView, setCurrentView] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adType, setAdType] = useState("");

  const breakpoints = Grid.useBreakpoint();

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
      image: "",
      zoomedImage: "",
      ets: "",
      eps: "",
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
    let i = 0;
    let JSONListCopy = [...JSONList];
    for (const item of JSONList) {
      const { data: fetchedEbayApiData, device } = item;
      const itemDataFilteredByCategoryId = await filterByCategoryId(
        fetchedEbayApiData,
        device
      );
      console.log(itemDataFilteredByCategoryId);
      const {
        data: { base64, zoomedBase64, ets, eps },
      } = await axios.post("/api/plot", {
        fetchedEbayApiData: itemDataFilteredByCategoryId,
        adType,
      });
      JSONListCopy[i] = {
        ...JSONListCopy[i],
        image: base64,
        zoomedImage: zoomedBase64,
        ets,
        eps,
      };
      setJSONList(JSONListCopy);
      i++;
    }
    setIsEvaluating(false);
  };

  const onAdTypeChange = (value) => {
    setAdType(value);
  };

  const openDetailModal = (i) => {
    setCurrentView(itemsContainer[i].text ?? itemsContainer[i]);
    setIsDetailModalVisible(true);
  };

  const handleDetailModalOk = () => {
    setIsDetailModalVisible(false);
  };

  const handleDetailModalCancel = () => {
    setIsDetailModalVisible(false);
  };

  return (
    <>
      <Typography.Title level={1}>Estimated Time to Sell</Typography.Title>
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
      <Row gutter={[16, 16]}>
        {JSONList?.map((json, i) => {
          return (
            <>
              <Col xs={24}>
                <Typography.Title level={3}>{json.name}</Typography.Title>
              </Col>
              {json.image && (
                <>
                  <Col xs={24} sm={12}>
                    <Card
                      key={i}
                      hoverable
                      cover={
                        <img
                          alt="Estimated Time to Sell Plot"
                          src={json.image}
                        />
                      }
                    >
                      <Typography.Paragraph>
                        {adType === "FixedPriceItem" || adType === "Both"
                          ? "Voraussichtliche Zeit bis zum Verkauf: "
                          : "Andere Verkäufer versteigerten dieses Produkt im durchschnittlichen Zeitraum von: "}

                        <Tag color="blue">
                          {Number(json.ets).toFixed(0)} Tage
                        </Tag>
                      </Typography.Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card
                      key={i}
                      hoverable
                      cover={
                        <img
                          alt="Estimated Time to Sell Plot"
                          src={json.zoomedImage}
                        />
                      }
                    >
                      <Typography.Paragraph>
                        Voraussichtlich optimalster Verkaufspreis:{" "}
                        <Tag color="green">{Number(json.eps).toFixed(2)}$</Tag>
                      </Typography.Paragraph>
                    </Card>
                  </Col>
                </>
              )}
              <Col xs={24} key={i}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {itemsContainer.find((el) => el.id === i) && (
                    <>
                      <Input.TextArea
                        value={itemsContainer.find((el) => el.id === i).text}
                      />
                      <Button onClick={() => openDetailModal(i)}>
                        Detailansicht
                      </Button>
                    </>
                  )}
                </Space>
                {i + 1 < JSONList.length && <Divider />}
              </Col>
            </>
          );
        })}
      </Row>
      <Modal
        title="Detailansicht"
        visible={isDetailModalVisible}
        onOk={handleDetailModalOk}
        onCancel={handleDetailModalCancel}
        width="auto"
      >
        <ReactJson src={currentView && JSON.parse(currentView)} />
      </Modal>
    </>
  );
};

export default Home;
