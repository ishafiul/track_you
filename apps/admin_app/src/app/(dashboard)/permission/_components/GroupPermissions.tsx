import { permissionApi } from '@/api/permission';
import { PermissionDocType } from 'permission-manager-worker/src/entity/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, Input, List, Popconfirm, Select, Space, Tag, Typography, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useEffect } from 'react';

const { Text } = Typography;

// Query keys for better organization and consistency
const QUERY_KEYS = {
  groups: ['groups'] as const,
  groupPermissions: ['group-permissions'] as const,
  docTypes: ['doc-types'] as const,
  roles: (type: PermissionDocType) => ['roles', type] as const,
};

type PermissionFormValues = {
  subject: string;
  type: PermissionDocType;
  id: string;
  role: string;
};

export default function GroupPermissions() {
  const [form] = Form.useForm<PermissionFormValues>();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  // Get all groups and their permissions
  const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useQuery({
    queryKey: QUERY_KEYS.groupPermissions,
    queryFn: () => permissionApi.getGroupPermissions(),
    retry: 2,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Get document types for the form
  const { data: docTypesData, error: docTypesError } = useQuery({
    queryKey: QUERY_KEYS.docTypes,
    queryFn: () => permissionApi.getDocTypes(),
    staleTime: 5 * 60 * 1000, // Doc types rarely change, keep fresh for 5 minutes
  });

  // Get roles for selected doc type
  const selectedType = Form.useWatch('type', form);
  const { data: rolesData, error: rolesError } = useQuery({
    queryKey: QUERY_KEYS.roles(selectedType as PermissionDocType),
    queryFn: () => selectedType ? permissionApi.getRoles(selectedType as PermissionDocType) : null,
    enabled: !!selectedType,
    staleTime: 30000,
  });

  // Get list of groups
  const { data: groupsList, error: groupsListError } = useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: () => permissionApi.listGroups(),
    staleTime: 30000,
  });

  // Show errors if any queries failed
  useEffect(() => {
    if (groupsError) messageApi.error('Failed to load group permissions: ' + groupsError.message);
    if (docTypesError) messageApi.error('Failed to load document types: ' + docTypesError.message);
    if (rolesError) messageApi.error('Failed to load roles: ' + rolesError.message);
    if (groupsListError) messageApi.error('Failed to load groups: ' + groupsListError.message);
  }, [groupsError, docTypesError, rolesError, groupsListError, messageApi]);

  const grantPermissionMutation = useMutation({
    mutationFn: (values: PermissionFormValues) => permissionApi.setPermission({
      ...values,
      expires_at: null
    }),
    onSuccess: () => {
      messageApi.success('Permission granted successfully');
      // Invalidate both group permissions and the groups list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupPermissions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
      form.resetFields();
    },
    onError: (error) => {
      messageApi.error('Failed to grant permission: ' + error.message);
    }
  });

  const revokePermissionMutation = useMutation({
    mutationFn: (values: { subject: string; type: PermissionDocType; id: string }) => 
      permissionApi.revokePermission(values),
    onSuccess: () => {
      messageApi.success('Permission revoked successfully');
      // Invalidate both group permissions and the groups list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupPermissions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups });
    },
    onError: (error) => {
      messageApi.error('Failed to revoke permission: ' + error.message);
    }
  });

  const handleSubmit = (values: PermissionFormValues) => {
    grantPermissionMutation.mutate(values);
  };

  return (
    <>
      {contextHolder}
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="Grant Group Permission">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="subject"
              label="Group"
              rules={[{ required: true, message: 'Please select a group!' }]}
            >
              <Select
                placeholder="Select group"
                options={groupsList?.groups.map(group => ({ 
                  label: group, 
                  value: `group:${group}` 
                }))}
              />
            </Form.Item>

            <Form.Item
              name="type"
              label="Document Type"
              rules={[{ required: true, message: 'Please select a document type!' }]}
            >
              <Select
                placeholder="Select document type"
                options={docTypesData?.types.map(type => ({ 
                  label: type, 
                  value: type 
                }))}
              />
            </Form.Item>

            <Form.Item
              name="id"
              label="Resource ID"
              rules={[{ required: true, message: 'Please input the resource ID!' }]}
              tooltip="Use '*' for wildcard access to all resources of this type"
            >
              <Input placeholder="Enter resource ID or * for all" />
            </Form.Item>

            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select a role!' }]}
            >
              <Select
                placeholder="Select role"
                disabled={!selectedType}
                options={rolesData ? Object.keys(rolesData.roles).map(role => ({
                  label: role,
                  value: role
                })) : []}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={grantPermissionMutation.isPending}
              >
                Grant Permission
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Group Permissions">
          {groupsLoading ? (
            <div>Loading group permissions...</div>
          ) : groupsError ? (
            <div>Error loading group permissions. Please try again.</div>
          ) : !groupsData?.groups || Object.keys(groupsData.groups).length === 0 ? (
            <div>No group permissions found.</div>
          ) : (
            <List
              dataSource={Object.entries(groupsData.groups)}
              renderItem={([groupName, permissions]) => (
                <List.Item>
                  <Card 
                    title={groupName} 
                    style={{ width: '100%' }}
                  >
                    {permissions.length === 0 ? (
                      <div>No permissions assigned to this group.</div>
                    ) : (
                      <List
                        dataSource={permissions}
                        renderItem={(permission) => (
                          <List.Item>
                            <Space>
                              <Tag color="blue">{permission.type}</Tag>
                              <Text>{permission.id}</Text>
                              <Tag color="green">{permission.role}</Tag>
                              <Popconfirm
                                title="Revoke Permission"
                                description="Are you sure you want to revoke this permission?"
                                onConfirm={() => revokePermissionMutation.mutate({
                                  subject: `group:${groupName}`,
                                  type: permission.type,
                                  id: permission.id
                                })}
                                okText="Yes"
                                cancelText="No"
                              >
                                <Button 
                                  danger 
                                  icon={<DeleteOutlined />}
                                  size="small"
                                  loading={revokePermissionMutation.isPending}
                                >
                                  Revoke
                                </Button>
                              </Popconfirm>
                            </Space>
                          </List.Item>
                        )}
                      />
                    )}
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Space>
    </>
  );
} 