'use client';

import { useState, useEffect } from 'react';
import { Modal, Checkbox, Space, Button, Typography, Divider, message, Spin } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionApi } from '@/api/permission';
import { userApi, UserWithPermissions } from '@/api/user';
import { PermissionDocType } from 'permission-manager-worker/src/entity/schema';

const { Title } = Typography;

interface UpdatePermissionDialogProps {
  user: UserWithPermissions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdatePermissionDialog({
  user,
  open,
  onOpenChange,
}: UpdatePermissionDialogProps) {
  const queryClient = useQueryClient();

  // Get available document types
  const { data: docTypes = [], isLoading: isLoadingDocTypes } = useQuery({
    queryKey: ['docTypes'],
    queryFn: async () => {
      const response = await permissionApi.getDocTypes();
      return response.types;
    },
    enabled: open, // Only fetch when dialog is open
  });

  // Get available groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await permissionApi.listGroups();
      return response.groups;
    },
    enabled: open, // Only fetch when dialog is open
  });

  // Get roles for each doc type
  const { data: rolesByType = {}, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles', docTypes],
    queryFn: async () => {
      if (!docTypes.length) return {};
      
      const roles: Record<string, Record<string, any>> = {};
      for (const type of docTypes) {
        const response = await permissionApi.getRoles(type as PermissionDocType);
        roles[type] = response.roles;
      }
      return roles;
    },
    enabled: open && docTypes.length > 0, // Only fetch when dialog is open and we have docTypes
  });

  // Selected permissions state
  const [selectedPermissions, setSelectedPermissions] = useState<Array<{
    type: PermissionDocType;
    id: string;
    role: string;
  }>>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Reset state when dialog opens/closes or user changes
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setSelectedPermissions([]);
      setSelectedGroups([]);
    } else if (user) {
      // Update state when dialog opens with a user
      setSelectedPermissions(
        user.permissions?.map(p => ({
          type: p.type,
          id: p.id,
          role: p.role,
        })) || []
      );
      setSelectedGroups(user.groups || []);
    }
  }, [user, open]);

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user selected');

      // 1. Handle group membership changes
      const currentGroups = new Set(user.groups || []);
      const selectedGroupsSet = new Set(selectedGroups);

      // Groups to add
      const groupsToAdd = selectedGroups.filter(group => !currentGroups.has(group));
      // Groups to remove
      const groupsToRemove = [...currentGroups].filter(group => !selectedGroupsSet.has(group));

      // Add user to new groups
      await Promise.all(groupsToAdd.map(group => 
        permissionApi.addToGroup({
          user: user.id,
          group
        })
      ));

      // Remove user from old groups
      await Promise.all(groupsToRemove.map(group => 
        permissionApi.removeFromGroup({
          user: user.id,
          group
        })
      ));

      // 2. Handle permission changes
      const currentPermissions = new Set(
        user.permissions?.map(p => `${p.type}:${p.id}:${p.role}`) || []
      );
      const selectedPermissionsSet = new Set(
        selectedPermissions.map(p => `${p.type}:${p.id}:${p.role}`)
      );

      // Permissions to add
      const permissionsToAdd = selectedPermissions.filter(
        p => !currentPermissions.has(`${p.type}:${p.id}:${p.role}`)
      );

      // Permissions to remove
      const permissionsToRemove = user.permissions?.filter(
        p => !selectedPermissionsSet.has(`${p.type}:${p.id}:${p.role}`)
      ) || [];

      // Grant new permissions
      await Promise.all(permissionsToAdd.map(p => 
        permissionApi.setPermission({
          subject: `user:${user.id}`,
          type: p.type,
          id: p.id,
          role: p.role
        })
      ));

      // Revoke old permissions
      await Promise.all(permissionsToRemove.map(p => 
        permissionApi.revokePermission({
          subject: `user:${user.id}`,
          type: p.type,
          id: p.id
        })
      ));
    },
    onSuccess: () => {
      message.success('Permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Update error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to update permissions');
    },
  });

  const handleSave = () => {
    if (!selectedPermissions.length && !selectedGroups.length) {
      message.warning('Please select at least one permission or group');
      return;
    }

    // Validate permission format before sending
    const invalidPermissions = selectedPermissions.some(p => !p.type || !p.role);
    if (invalidPermissions) {
      message.error('Invalid permission format. Please ensure all permissions have type and role.');
      return;
    }

    updatePermissionsMutation.mutate();
  };

  const handlePermissionChange = (
    type: PermissionDocType,
    id: string,
    role: string,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, { type, id: id || '*', role }]);
    } else {
      setSelectedPermissions(prev =>
        prev.filter(p => !(p.type === type && p.id === id && p.role === role))
      );
    }
  };

  const isLoading = isLoadingDocTypes || isLoadingGroups || isLoadingRoles;
  const isSaving = updatePermissionsMutation.isPending;

  // Don't render content if no user is selected
  if (!user && open) {
    return null;
  }

  return (
    <Modal
      title={`Update Permissions - ${user?.name}`}
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          loading={isSaving}
          disabled={isLoading}
        >
          Save Changes
        </Button>,
      ]}
      width={600}
    >
      {isLoading ? (
        <Spin />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {docTypes.map((type) => (
            <div key={type}>
              <Title level={5}>{type} Permissions</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                {rolesByType[type] && Object.entries(rolesByType[type]).map(([role, def]) => (
                  <Checkbox
                    key={`${type}-${role}`}
                    checked={selectedPermissions.some(
                      p => p.type === type && p.role === role
                    )}
                    onChange={(e: CheckboxChangeEvent) => {
                      handlePermissionChange(
                        type as PermissionDocType,
                        '*',
                        role,
                        e.target.checked
                      );
                    }}
                  >
                    {role}
                  </Checkbox>
                ))}
              </Space>
            </div>
          ))}

          <Divider />

          <div>
            <Title level={5}>Groups</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {groups.map((group) => (
                <Checkbox
                  key={group}
                  checked={selectedGroups.includes(group)}
                  onChange={(e: CheckboxChangeEvent) => {
                    setSelectedGroups(
                      e.target.checked
                        ? [...selectedGroups, group]
                        : selectedGroups.filter((g) => g !== group)
                    );
                  }}
                >
                  {group}
                </Checkbox>
              ))}
            </Space>
          </div>
        </Space>
      )}
    </Modal>
  );
} 