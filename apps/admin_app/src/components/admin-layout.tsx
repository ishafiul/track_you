'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Breadcrumb, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  SettingOutlined,
  LogoutOutlined,
  CalendarOutlined,
  DollarOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;

export interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const pathname = usePathname();

  // Generate breadcrumb items based on the current path
  const getBreadcrumbItems = () => {
    if (!pathname) return [{ title: <Link href="/">Home</Link>, key: 'home' }];
    
    const paths = pathname.split('/').filter(Boolean);

    const breadcrumbItems = [
      {
        title: <Link href="/">Home</Link>,
        key: 'home',
      },
    ];

    // Add intermediate paths
    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      breadcrumbItems.push({
        title: <Link href={currentPath}>{path.charAt(0).toUpperCase() + path.slice(1)}</Link>,
        key: path,
      });
    });

    return breadcrumbItems;
  };

  const handleLogout = async () => {
  
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          className="demo-logo-vertical"
          style={{
            height: 64,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'white',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'AD' : 'Admin Dashboard'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: 'home',
              icon: <DashboardOutlined />,
              label: <Link href="/">Dashboard</Link>,
            },
            {
              key: 'permission',
              icon: <CalendarOutlined />,
              label: <Link href="/permission">Permission</Link>,
            },
            {
              key: 'users',
              icon: <UserOutlined />,
              label: <Link href="/users">Users</Link>,
            },
            {
              key: 'subscriptions',
              icon: <DollarOutlined />,
              label: <Link href="/subscriptions">Subscriptions</Link>,
            }
          ]}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              loading={logoutLoading}
              style={{ fontSize: '16px' }}
            >
              Logout
            </Button>
          </div>
        </Header>
        <br />
        <Breadcrumb items={getBreadcrumbItems()} />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
