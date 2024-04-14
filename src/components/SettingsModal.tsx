import React, { ReactNode, useEffect, useState } from "react";
import {
  Button,
  Divider,
  Form,
  FormProps,
  Input,
  InputNumber,
  Modal
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
  username: string;
  password: string;
};

const SettingsModal = ({
  isModalVisible,
  setIsModalVisible
}: SettingsModalProps) => {
  const [form] = Form.useForm();
  const [testConnectionIcon, setTestConnectionIcon] =
    useState<null | ReactNode>(null);

  useEffect(() => {
    if (testConnectionIcon) {
      setTimeout(() => {
        setTestConnectionIcon(null);
      }, 3000);
    }
  }, [testConnectionIcon]);

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    window.electronApi.setToStore(values);
  };

  const handleSelectFolder = async () => {
    const selectedFolder = await window.electronApi.selectFolder();
    form.setFieldValue("downloadFolder", selectedFolder);
  };

  const handleTestConnection = async () => {
    const response = await window.electronApi.testDbConnection({
      dbValues: form.getFieldsValue()
    });

    if (response.status === "success") {
      setTestConnectionIcon(<CheckOutlined />);
    } else {
      setTestConnectionIcon(<CloseOutlined />);
    }
  };

  return (
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
      >
        <Divider>Folder</Divider>

        <Form.Item<FieldType>
          label="Download folder"
          name="downloadFolder"
          rules={[{ required: true, message: "Please select a folder" }]}
        >
          <Input allowClear />
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
          <Input />
        </Form.Item>

        <div style={{ display: "flex", gap: 10 }}>
          <Form.Item shouldUpdate>
            {() => {
              return (
                <Button
                  disabled={
                    !form.isFieldsTouched(true) ||
                    form.getFieldsError().filter(({ errors }) => {
                      return errors.length;
                    }).length > 0
                  }
                  type="primary"
                  htmlType="submit"
                >
                  Save Settings
                </Button>
              );
            }}
          </Form.Item>

          <Button icon={testConnectionIcon} onClick={handleTestConnection}>
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
  );
};

export default SettingsModal;
