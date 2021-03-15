import React from "react";
import { Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

const FileUpload = ({ etsJSONList, setEtsJSONList }) => {
  const props = {
    onRemove: (file) => {
      const index = etsJSONList.indexOf(file);
      const newFileList = etsJSONList.slice();
      newFileList.splice(index, 1);
      setEtsJSONList(newFileList);
    },
    beforeUpload: (file) => {
      setEtsJSONList([...etsJSONList, file]);
      console.log(file);
      return false;
    },
    etsJSONList,
    multiple: false,
    accept: "application/json",
    showUploadList: false,
  };

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Click or drag a JSON file in this area.</p>
      <p className="ant-upload-hint">
        JSON files must have the correct{" "}
        <a href="/format" target="_blank">
          format
        </a>
      </p>
    </Dragger>
  );
};

export default FileUpload;
