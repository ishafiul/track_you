'use client';

import { Table, Button, Tag, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { userApi, UserWithPermissions } from '@/api/user';

interface UserListProps {
  onUpdatePermission: (user: UserWithPermissions) => void;
}

export function UserList({ onUpdatePermission }: UserListProps) {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getUsers,
    initialData: [], // Provide initial data to avoid undefined during first render
  });

  if (error) {
    message.error('Failed to load users');
  }

  const columns: ColumnsType<UserWithPermissions> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: UserWithPermissions['permissions']) => (
        <Space size={[0, 8]} wrap>
          {permissions?.map((permission) => (
            <Tag key={`${permission.type}-${permission.id}-${permission.role}`} color="blue">
              {`${permission.type}:${permission.id} (${permission.role})`}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Groups',
      dataIndex: 'groups',
      key: 'groups',
      render: (groups: string[]) => (
        <Space size={[0, 8]} wrap>
          {groups?.map((group) => (
            <Tag key={group}>{group}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => onUpdatePermission(record)}>
          Update Permissions
        </Button>
      ),
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={users} 
      rowKey="id" 
      loading={isLoading}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} users`,
      }}
    />
  );
} 