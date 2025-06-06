import { PermissionDocType, Permission } from 'permission-manager-worker/src/entity/schema';
import httpClient from './http-client';

// Types
type RoleDefinition = {
  permissions: Permission[];
  inherits: string[];
};

type SetRoleDto = {
  type: PermissionDocType;
  role: string;
  permissions: Permission[];
  inherits?: string[];
};

type SetPermissionDto = {
  subject: string; // Format: 'user:123' or 'group:123'
  type: PermissionDocType;
  id: string; // Can be "*" for wildcard
  role: string;
  expires_at?: number | null;
};

type RevokePermissionDto = {
  subject: string; // Format: 'user:123' or 'group:123'
  type: PermissionDocType;
  id: string; // Can be "*" for wildcard
};

type ResourcePermission = {
  type: PermissionDocType;
  id: string;
  role: string;
  expires_at?: number | null;
};

type UserRole = {
  type: PermissionDocType;
  id: string;
  role: string;
  expires_at?: number | null;
};

export const permissionApi = {
  // Document Types
  getDocTypes: async (): Promise<{ types: string[] }> => {
    const response = await httpClient.get<{ types: string[] }>('/permissions/doc-types');
    if (!response.types) {
      throw new Error('Failed to get document types');
    }
    return response;
  },

  // Roles
  getRoles: async (type: PermissionDocType): Promise<{ roles: Record<string, RoleDefinition> }> => {
    const response = await httpClient.get<{ roles: Record<string, RoleDefinition> }>(`/permissions/roles/${type}`);
    if (!response.roles) {
      throw new Error('Failed to get roles');
    }
    return response;
  },

  getRole: async (type: PermissionDocType, role: string): Promise<{ role: string; permissions: Permission[]; inherits: string[] }> => {
    const response = await httpClient.get<{ role: string; permissions: Permission[]; inherits: string[] }>(`/permissions/roles/${type}/${role}`);
    if (!response.role) {
      throw new Error('Failed to get role');
    }
    return response;
  },

  setRole: async (request: SetRoleDto): Promise<{ ok: boolean }> => {
    const response = await httpClient.post<{ ok: boolean }>('/permissions/role', request);
    if (!response.ok) {
      throw new Error('Failed to set role');
    }
    return response;
  },

  editRole: async (request: SetRoleDto): Promise<{ ok: boolean }> => {
    const response = await httpClient.put<{ ok: boolean }>('/permissions/role', request);
    if (!response.ok) {
      throw new Error('Failed to edit role');
    }
    return response;
  },

  deleteRole: async (type: PermissionDocType, role: string): Promise<{ ok: boolean }> => {
    const response = await httpClient.delete<{ ok: boolean }>(`/permissions/roles/${type}/${role}`);
    if (!response.ok) {
      throw new Error('Failed to delete role');
    }
    return response;
  },

  // User Permissions
  getUserRoles: async (userId: string, type: PermissionDocType): Promise<{ roles: UserRole[] }> => {
    const response = await httpClient.get<{ roles: UserRole[] }>(`/permissions/users/${userId}/roles/${type}`);
    if (!response.roles) {
      throw new Error('Failed to get user roles');
    }
    return response;
  },

  getUserGroups: async (userId: string): Promise<{ groups: string[] }> => {
    const response = await httpClient.get<{ groups: string[] }>(`/permissions/users/${userId}/groups`);
    if (!response.groups) {
      throw new Error('Failed to get user groups');
    }
    return response;
  },

  // Permissions
  setPermission: async (request: SetPermissionDto): Promise<{ ok: boolean }> => {
    try {
      const response = await httpClient.post<{ ok: boolean }>('/permissions/grant', request);
      if (!response.ok) {
        throw new Error('Failed to grant permission');
      }
      return response;
    } catch (error) {
      console.error('Grant permission error:', error);
      throw error;
    }
  },

  revokePermission: async (request: RevokePermissionDto): Promise<{ ok: boolean }> => {
    try {
      const response = await httpClient.post<{ ok: boolean }>('/permissions/revoke', request);
      if (!response.ok) {
        throw new Error('Failed to revoke permission');
      }
      return response;
    } catch (error) {
      console.error('Revoke permission error:', error);
      throw error;
    }
  },

  // Groups
  listGroups: async (): Promise<{ groups: string[] }> => {
    const response = await httpClient.get<{ groups: string[] }>('/permissions/groups');
    if (!response.groups) {
      throw new Error('Failed to list groups');
    }
    return response;
  },

  getGroupMembers: async (group: string): Promise<{ members: string[] }> => {
    const response = await httpClient.get<{ members: string[] }>(`/permissions/groups/${group}/members`);
    if (!response.members) {
      throw new Error('Failed to get group members');
    }
    return response;
  },

  getGroupPermissions: async (group?: string): Promise<{ groups: Record<string, ResourcePermission[]> }> => {
    const url = group ? `/permissions/groups/permissions?group=${group}` : '/permissions/groups/permissions';
    const response = await httpClient.get<{ groups: Record<string, ResourcePermission[]> }>(url);
    if (!response.groups) {
      throw new Error('Failed to get group permissions');
    }
    return response;
  },

  addToGroup: async (request: { user: string, group: string }): Promise<{ ok: boolean }> => {
    const response = await httpClient.post<{ ok: boolean }>('/permissions/groups/add-member', request);
    if (!response.ok) {
      throw new Error('Failed to add user to group');
    }
    return response;
  },

  removeFromGroup: async (request: { user: string, group: string }): Promise<{ ok: boolean }> => {
    const response = await httpClient.post<{ ok: boolean }>('/permissions/groups/remove-member', request);
    if (!response.ok) {
      throw new Error('Failed to remove user from group');
    }
    return response;
  }
};
