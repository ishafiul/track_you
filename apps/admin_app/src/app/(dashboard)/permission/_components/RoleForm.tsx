import { permissionApi } from '@/api/permission';
import { PermissionDocType, Permission } from 'permission-manager-worker/src/entity/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Select, Space, message } from 'antd';
import { useEffect } from 'react';

type RoleFormProps = {
  docType: PermissionDocType;
  editingRole?: string;
  onSuccess: () => void;
};

type FormValues = {
  role: string;
  permissions: Permission[];
  inherits: string[];
};

export default function RoleForm({ docType, editingRole, onSuccess }: RoleFormProps) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  // Get existing roles for inheritance selection
  const { data: rolesData } = useQuery({
    queryKey: ['roles', docType],
    queryFn: () => permissionApi.getRoles(docType)
  });

  // If editing, get the role details
  const { data: roleData } = useQuery({
    queryKey: ['role', docType, editingRole],
    queryFn: () => editingRole ? permissionApi.getRole(docType, editingRole) : null,
    enabled: !!editingRole
  });

  // Set form values when editing
  useEffect(() => {
    if (roleData) {
      form.setFieldsValue({
        role: roleData.role,
        permissions: roleData.permissions,
        inherits: roleData.inherits
      });
    }
  }, [roleData, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const request = {
        type: docType,
        role: values.role,
        permissions: values.permissions,
        inherits: values.inherits
      };
      return editingRole ? permissionApi.editRole(request) : permissionApi.setRole(request);
    },
    onSuccess: () => {
      messageApi.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['roles', docType] });
      if (editingRole) {
        queryClient.invalidateQueries({ queryKey: ['role', docType, editingRole] });
      }
      form.resetFields();
      onSuccess();
    },
    onError: (error) => {
      messageApi.error(`Failed to ${editingRole ? 'update' : 'create'} role: ` + error.message);
    }
  });

  const handleSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  const availablePermissions: Permission[] = ['view', 'edit', 'admin', 'delete', 'create', 'owner'];
  const availableRoles = rolesData ? Object.keys(rolesData.roles).filter(role => role !== editingRole) : [];

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          permissions: [],
          inherits: []
        }}
      >
        <Form.Item
          name="role"
          label="Role Name"
          rules={[{ required: true, message: 'Please input the role name!' }]}
        >
          <Input 
            placeholder="Enter role name"
            disabled={!!editingRole}
          />
        </Form.Item>

        <Form.Item
          name="permissions"
          label="Permissions"
          rules={[{ required: true, message: 'Please select at least one permission!' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select permissions"
            options={availablePermissions.map(perm => ({ label: perm, value: perm }))}
          />
        </Form.Item>

        <Form.Item
          name="inherits"
          label="Inherits From"
        >
          <Select
            mode="multiple"
            placeholder="Select roles to inherit from"
            options={availableRoles.map(role => ({ label: role, value: role }))}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={mutation.isPending}
            >
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
} 