'use client';
import React from 'react';
import { Typography } from 'antd';
import CustomMDXEditor from "@/components/mdx-editor";

const { Title } = Typography;

export default function Dashboard() {
  return (
    <>
      <Title level={2}>Dashboard</Title>
      <p>Welcome to the Admin Dashboard</p>
      <CustomMDXEditor></CustomMDXEditor>
    </>
  );
}
