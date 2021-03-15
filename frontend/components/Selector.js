import React from "react";
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
  Select,
  Tag,
} from "antd";
import { DotChartOutlined } from "@ant-design/icons";

const Selector = ({
  JSONList,
  loadTestDataDirectly,
  onAdTypeChange,
  isEvaluating,
  isLoading,
  evaluateData,
  adType,
  breakpoints,
}) => {
  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space direction={breakpoints.xs ? "vertical" : "horizontal"}>
          <Select
            placeholder="Testdaten einladen"
            onChange={loadTestDataDirectly}
            loading={isLoading}
          >
            <Select.Option value="macbook">MacBook</Select.Option>
            <Select.Option value="macbook2017">
              MacBook (Baujahr 2017)
            </Select.Option>
            <Select.Option value="nintendoswitch">
              Nintendo Switch
            </Select.Option>
            <Select.Option value="ps4">PlayStation 4</Select.Option>
          </Select>
          {JSONList.length > 0 && (
            <Space direction="horizontal">
              <Select
                placeholder="Anzeigetyp wählen"
                onChange={onAdTypeChange}
                loading={isEvaluating}
              >
                <Select.Option value="FixedPriceItem">
                  Sofort kaufen
                </Select.Option>
                <Select.Option value="Chinese">Auktionen</Select.Option>
                <Select.Option value="Both">Beide</Select.Option>
              </Select>
              <Button
                onClick={evaluateData}
                type="primary"
                disabled={!!!adType}
                icon={<DotChartOutlined />}
              />
            </Space>
          )}
        </Space>
      </Space>
      {JSONList.length > 0 && <Divider />}
    </>
  );
};

export default Selector;
