import React, { useState } from "react";
import {
  Button,
  Divider,
  Form,
  FormProps,
  Input,
  InputNumber,
  Modal,
  notification
} from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

type SettingsModalProps = {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
};

type FieldType = {
  downloadFolder: string;
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
};

const SettingsModal = ({
  isModalVisible,
  setIsModalVisible
}: SettingsModalProps) => {
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();
  const [isConnectionVerified, setIsConnectionVerified] = useState(false);

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    window.electronApi.setToStore(values);
  };

  const handleSelectFolder = async () => {
    const selectedFolder = await window.electronApi.selectFolder();
    form.setFieldValue("downloadFolder", selectedFolder);
    form.validateFields();
  };

  const handleTestConnection = async () => {
    const response = await window.electronApi.testDbConnection({
      dbValues: form.getFieldsValue()
    });

    console.log(response);

    if (!response.isPostGISInstalled && response.error == null) {
      api.error({
        message: "Warning!",
        description: "PostGIS extension must be installed into database",
        placement: "top"
      });
    }

    setIsConnectionVerified(
      response.isDatabaseVerified &&
        response.isPostGISInstalled &&
        response.error == null
    );
  };

  return (
    <>
      {contextHolder}
      <Modal
        footer={null}
        title="Settings"
        open={isModalVisible}
        closable={false}
        destroyOnClose
      >
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          preserve={false}
          onChange={() => {
            form.validateFields();
            setIsConnectionVerified(false);
          }}
        >
          <Divider>Folder</Divider>

          <Form.Item<FieldType>
            label="Download folder"
            name="downloadFolder"
            rules={[{ required: true, message: "Please select a folder" }]}
          >
            <Input />
          </Form.Item>

          <Button onClick={handleSelectFolder}>Select folder</Button>

          <Divider>Database</Divider>

          <Form.Item<FieldType>
            label="Host"
            name="host"
            rules={[{ required: true, message: "Please enter a host" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            label="Port"
            name="port"
            rules={[{ required: true, message: "Please enter a port" }]}
          >
            <InputNumber />
          </Form.Item>

          <Form.Item<FieldType>
            label="Database"
            name="database"
            rules={[{ required: true, message: "Please enter a database" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType> label="Username" name="username">
            <Input />
          </Form.Item>

          <Form.Item<FieldType> label="Password" name="password">
            <Input.Password />
          </Form.Item>

          <div style={{ display: "flex", gap: 10 }}>
            <Form.Item shouldUpdate>
              {() => {
                return (
                  <Button
                    disabled={
                      form.getFieldsError().filter(({ errors }) => {
                        return errors.length;
                      }).length > 0 || !isConnectionVerified
                    }
                    type="primary"
                    htmlType="submit"
                  >
                    Save Settings
                  </Button>
                );
              }}
            </Form.Item>

            <Button
              icon={
                isConnectionVerified ? <CheckOutlined /> : <CloseOutlined />
              }
              onClick={handleTestConnection}
              style={{
                background: isConnectionVerified ? "limegreen" : "red",
                color: "white"
              }}
            >
              Test connection
            </Button>

            <Button
              onClick={() => {
                return setIsModalVisible(false);
              }}
            >
              Close
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default SettingsModal;
