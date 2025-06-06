import { permissionApi } from '@/api/permission';
import { PermissionDocType, Permission } from 'permission-manager-worker/src/entity/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, List, Popconfirm, Space, Tag, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

type RolesListProps = {
  docType: PermissionDocType;
  onEditRole: (role: string) => void;
};

const permissionColors: Record<Permission, string> = {
  view: 'blue',
  edit: 'green',
  admin: 'red',
  delete: 'orange',
  create: 'purple',
  owner: 'magenta'
};

export default function RolesList({ docType, onEditRole }: RolesListProps) {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles', docType],
    queryFn: () => permissionApi.getRoles(docType)
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (role: string) => permissionApi.deleteRole(docType, role),
    onSuccess: () => {
      messageApi.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles', docType] });
    },
    onError: (error) => {
      messageApi.error('Failed to delete role: ' + error.message);
    }
  });

  return (
    <>
      {contextHolder}
      <List
        loading={isLoading}
        dataSource={rolesData ? Object.entries(rolesData.roles) : []}
        renderItem={([roleName, roleData]) => (
          <List.Item>
            <Card 
              title={roleName}
              extra={
                <Space>
                  <Button 
                    icon={<EditOutlined />} 
                    onClick={() => onEditRole(roleName)}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete Role"
                    description="Are you sure you want to delete this role?"
                    onConfirm={() => deleteRoleMutation.mutate(roleName)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button 
                      danger 
                      icon={<DeleteOutlined />}
                      loading={deleteRoleMutation.isPending}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              }
              style={{ width: '100%' }}
            >
              <Space direction="vertical">
                <div>
                  <Text strong>Permissions: </Text>
                  <Space size={[0, 8]} wrap>
                    {roleData.permissions.map((permission) => (
                      <Tag color={permissionColors[permission]} key={permission}>
                        {permission}
                      </Tag>
                    ))}
                  </Space>
                </div>
                {roleData.inherits.length > 0 && (
                  <div>
                    <Text strong>Inherits from: </Text>
                    <Space size={[0, 8]} wrap>
                      {roleData.inherits.map((inherited) => (
                        <Tag key={inherited}>{inherited}</Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </>
  );
} 