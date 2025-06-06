import { PermissionDocType } from 'permission-manager-worker/src/entity/schema';
import httpClient from './http-client';
import { permissionApi } from './permission';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  type: PermissionDocType;
  id: string;
  role: string;
  expires_at?: number | null;
}

export interface UserWithPermissions extends User {
  permissions: UserPermission[];
  groups: string[];
}

export const userApi = {
  // Users
  getUsers: async (): Promise<UserWithPermissions[]> => {
    // Get basic user data
    const response = await httpClient.get<{ users: User[] }>('/users');
    if (!response.users) {
      throw new Error('Failed to get users');
    }

    // Get document types for fetching permissions
    const docTypesResponse = await permissionApi.getDocTypes();
    
    // Fetch permissions and groups for each user
    const usersWithPermissions = await Promise.all(response.users.map(async (user) => {
      const permissions: UserPermission[] = [];
      const groupsResponse = await permissionApi.getUserGroups(user.id);

      // Get permissions for each document type
      await Promise.all(docTypesResponse.types.map(async (type) => {
        try {
          const userRoles = await permissionApi.getUserRoles(user.id, type as PermissionDocType);
          permissions.push(...userRoles.roles);
        } catch (error) {
          // If user has no permissions for this type, skip
          if (error instanceof Error && !error.message.includes('No groups found')) {
            console.error(`Error fetching permissions for user ${user.id}:`, error);
          }
        }
      }));

      return {
        ...user,
        permissions,
        groups: groupsResponse.groups
      };
    }));

    return usersWithPermissions;
  }
}; 