'use client';
import { permissionApi } from '@/api/permission';
import { useQuery } from '@tanstack/react-query';
import { Card, Tabs, Typography, message } from 'antd';
import { useState } from 'react';
import RolesList from './_components/RolesList';
import RoleForm from './_components/RoleForm';
import GroupPermissions from './_components/GroupPermissions';
import { PermissionDocType } from 'permission-manager-worker/src/entity/schema';

const { Title } = Typography;

export default function PermissionPage() {
  const [selectedDocType, setSelectedDocType] = useState<PermissionDocType>('user');
  const [editingRole, setEditingRole] = useState<string>();
  const [messageApi, contextHolder] = message.useMessage();

  // Get document types
  const { data: docTypesData, isLoading } = useQuery({
    queryKey: ['doc-types'],
    queryFn: () => permissionApi.getDocTypes()
  });

  const handleEditRole = (role: string) => {
    setEditingRole(role);
  };

  const handleRoleFormSuccess = () => {
    setEditingRole(undefined);
  };

  const items = [
    {
      key: 'roles',
      label: 'Role Management',
      children: (
        <div className="space-y-6">
          <Card>
            <Title level={4}>Document Type</Title>
            <Tabs
              activeKey={selectedDocType}
              onChange={(key) => setSelectedDocType(key as PermissionDocType)}
              items={docTypesData?.types.map(type => ({
                key: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
                children: (
                  <div className="space-y-6">
                    <Card title={editingRole ? 'Edit Role' : 'Create Role'}>
                      <RoleForm 
                        docType={selectedDocType}
                        editingRole={editingRole}
                        onSuccess={handleRoleFormSuccess}
                      />
                    </Card>
                    <Card title="Existing Roles">
                      <RolesList 
                        docType={selectedDocType}
                        onEditRole={handleEditRole}
                      />
                    </Card>
                  </div>
                )
              }))}
            />
          </Card>
        </div>
      )
    },
    {
      key: 'groups',
      label: 'Group Permissions',
      children: <GroupPermissions />
    }
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {contextHolder}
      <Title level={2}>Permission Management</Title>
      <Tabs
        defaultActiveKey="roles"
        items={items}
        className="mt-6"
      />
    </>
  );
}
