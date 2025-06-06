'use client'
import React, {useEffect, useState} from 'react';
import {AntdRegistry} from '@ant-design/nextjs-registry';
import {ConfigProvider} from 'antd';
import AdminLayout from '@/components/admin-layout';
import LoadingBar from '@/components/LoadingBar';
import AuthGuard from '@/guards/AuthGuard';


export default function RootLayout(props: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const {children} = props;
  return (
    <>
      <LoadingBar/>
      <AntdRegistry>
        <ConfigProvider>
          <AdminLayout>
            <AuthGuard>
              {children}
            </AuthGuard>
          </AdminLayout>
        </ConfigProvider>
      </AntdRegistry></>
  );
}
