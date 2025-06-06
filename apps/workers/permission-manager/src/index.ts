import {RpcTarget, WorkerEntrypoint} from "cloudflare:workers";
import {
	Subject,
	Role,
	Permission,
	RelationshipTuple,
	RoleDefinition,
	PermissionDocType
} from "./entity/schema";

import {
	DefineRoleRequest,
	GrantRoleRequest,
	RevokeRoleRequest,
	GroupMembershipRequest,
	CheckPermissionRequest,
	PermissionResult,
	SuccessResponse,
	DefineRoleRequestSchema,
	GrantRoleRequestSchema,
	RevokeRoleRequestSchema,
	GroupMembershipRequestSchema,
	CheckPermissionRequestSchema,
	ListRolesRequest,
	ListRolesResponse,
	ListRolesRequestSchema,
	DeleteRoleRequest,
	DeleteRoleRequestSchema,
	ListGroupsResponse,
	GetGroupMembersRequest,
	GetGroupMembersRequestSchema,
	GetGroupMembersResponse,
	GetGroupPermissionsRequest,
	GetGroupPermissionsRequestSchema,
	GetGroupPermissionsResponse,
	ResourcePermission,
	GrantRoleToMultipleRequest,
	GrantRoleToMultipleRequestSchema
} from "./dto/schema";

// Cache key prefix to ensure uniqueness
const CACHE_KEY_PREFIX = "https://permission-manager.key/";

export type Bindings = {
	PERMISSIONS_KV: KVNamespace;
};

// Key schemas following the KVFGA model
type RelationshipKey = `rel:${string}:${string}`; // rel:{type}:{id}
type GroupMembershipKey = `group_membership:${string}`; // group_membership:{user}
type RoleDefKey = `role_def:${string}:${string}`; // role_def:{type}:{role}
type MetaKey = `meta:${string}:${string}`; // meta:{type}:{id}

// Add new cache-related types
interface CachedPermissionResult {
	allowed: boolean;
	permissions: Permission[];
	cachedAt: number;
}

export class PermissionManager extends RpcTarget {
	// Cache TTLs in seconds
	private readonly CACHE_TTL = {
		RELATIONSHIP: 60, // 1 minute for relationship data
		ROLE_DEF: 300,    // 5 minutes for role definitions
		PERMISSIONS: 120  // 2 minutes for computed permissions
	};

	private readonly cache = caches.default;

	constructor(private env: Bindings) {
		super();
	}

	// Helper method to create consistent cache keys
	private cacheKey(type: string, ...parts: string[]): string {
		return `${CACHE_KEY_PREFIX}${type}:${parts.join(":")}`;
	}

	// Get permissions for groups
	async getGroupPermissions(request: GetGroupPermissionsRequest): Promise<GetGroupPermissionsResponse> {
		// Validate request
		const validatedData = GetGroupPermissionsRequestSchema.parse(request);
		const { group } = validatedData;

		// Try to get from cache first if looking for a specific group
		if (group) {
			const cacheKey = this.cacheKey('group-permissions', group);
			const cachedPermissions = await this.cache.match(cacheKey);
			if (cachedPermissions) {
				return cachedPermissions.json() as Promise<GetGroupPermissionsResponse>;
			}
		} else {
			// For all groups, use a different cache key
			const cacheKey = this.cacheKey('all-group-permissions');
			const cachedPermissions = await this.cache.match(cacheKey);
			if (cachedPermissions) {
				return cachedPermissions.json() as Promise<GetGroupPermissionsResponse>;
			}
		}

		// List all keys matching the relationship prefix
		const keyPrefix = 'rel:';
		const listResult = await this.env.PERMISSIONS_KV.list({ prefix: keyPrefix });

		// Map to store group permissions: { groupName -> ResourcePermission[] }
		const groupPermissions: Record<string, ResourcePermission[]> = {};

		// Process all relationship tuples to extract group permissions
		await Promise.all(listResult.keys.map(async (keyObj) => {
			const relKey = keyObj.name;
			// Extract type and id from 'rel:type:id'
			const parts = relKey.split(':');
			if (parts.length < 3) return; // Skip invalid keys

			// The type is the second element in the key
			const type = parts[1] as PermissionDocType;
			const id = parts.slice(2).join(':'); // In case id contains colons

			const relStr = await this.env.PERMISSIONS_KV.get(relKey);
			if (relStr) {
				try {
					const rel = JSON.parse(relStr) as RelationshipTuple;

					// Process groups in this relationship
					for (const groupSubject in rel.groups) {
						if (groupSubject.startsWith('group:')) {
							const groupName = groupSubject.substring(6); // Extract name from 'group:name'

							// Filter if we're looking for a specific group
							if (group && groupName !== group) continue;

							// Initialize array if needed
							if (!groupPermissions[groupName]) {
								groupPermissions[groupName] = [];
							}

							// Add this permission
							groupPermissions[groupName].push({
								type,
								id,
								role: rel.groups[groupSubject],
								expires_at: rel.expires_at?.[groupSubject] || null
							});
						}
					}
				} catch (e) {
					// Ignore parsing errors
				}
			}
		}));

		const result = { groups: groupPermissions };

		// Cache the result
		const cacheResponse = new Response(JSON.stringify(result), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': `max-age=${this.CACHE_TTL.RELATIONSHIP}`
			}
		});

		// Use the appropriate cache key
		const cacheKey = group
			? this.cacheKey('group-permissions', group)
			: this.cacheKey('all-group-permissions');

		await this.cache.put(cacheKey, cacheResponse);

		return result;
	}

	// Get members of a specific group
	async getGroupMembers(request: GetGroupMembersRequest): Promise<GetGroupMembersResponse> {
		// Validate request
		const validatedData = GetGroupMembersRequestSchema.parse(request);
		const { group } = validatedData;

		// Try to get from cache first
		const cacheKey = this.cacheKey('group-members', group);
		const cachedMembers = await this.cache.match(cacheKey);
		if (cachedMembers) {
			return cachedMembers.json() as Promise<GetGroupMembersResponse>;
		}

		// List all keys matching the group membership prefix
		const keyPrefix = 'group_membership:user:';
		const listResult = await this.env.PERMISSIONS_KV.list({ prefix: keyPrefix });

		const members: string[] = [];
		const groupSubject = `group:${group}` as Subject;

		// Check each user's group memberships
		await Promise.all(listResult.keys.map(async (keyObj) => {
			const key = keyObj.name;
			// Extract the user part from 'group_membership:user:username'
			const userKey = key.substring(keyPrefix.length);

			const membershipStr = await this.env.PERMISSIONS_KV.get(key);
			if (membershipStr) {
				try {
					const groups = JSON.parse(membershipStr) as Subject[];

					// Check if this user belongs to the requested group
					if (groups.includes(groupSubject)) {
						members.push(userKey);
					}
				} catch (e) {
					// Ignore parsing errors
				}
			}
		}));

		const result = { users: members };

		// Cache the result
		const cacheResponse = new Response(JSON.stringify(result), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': `max-age=${this.CACHE_TTL.RELATIONSHIP}`
			}
		});

		await this.cache.put(cacheKey, cacheResponse);

		return result;
	}

	// List all available groups
	async listGroups(): Promise<ListGroupsResponse> {
		// Try to get from cache first
		const cacheKey = this.cacheKey('groups-list');
		const cachedGroups = await this.cache.match(cacheKey);
		if (cachedGroups) {
			return cachedGroups.json() as Promise<ListGroupsResponse>;
		}

		// List all keys matching the group membership prefix
		const keyPrefix = 'group_membership:';
		const listResult = await this.env.PERMISSIONS_KV.list({ prefix: keyPrefix });

		// Set to track unique groups
		const uniqueGroups = new Set<string>();

		// Fetch all group memberships and extract group names
		await Promise.all(listResult.keys.map(async (keyObj) => {
			const membershipKey = keyObj.name;
			const membershipStr = await this.env.PERMISSIONS_KV.get(membershipKey);

			if (membershipStr) {
				try {
					const groups = JSON.parse(membershipStr) as string[];
					// Add each group to the unique set
					groups.forEach(group => {
						if (group.startsWith('group:')) {
							// Extract just the group name from 'group:name'
							uniqueGroups.add(group.substring(6));
						}
					});
				} catch (e) {
					// Ignore parsing errors
				}
			}
		}));

		// Also check relationship tuples for groups referenced there
		const relKeyPrefix = 'rel:';
		const relListResult = await this.env.PERMISSIONS_KV.list({ prefix: relKeyPrefix });

		await Promise.all(relListResult.keys.map(async (keyObj) => {
			const relKey = keyObj.name;
			const relStr = await this.env.PERMISSIONS_KV.get(relKey);

			if (relStr) {
				try {
					const rel = JSON.parse(relStr) as RelationshipTuple;
					// Check groups in the relationship
					for (const groupSubject in rel.groups) {
						if (groupSubject.startsWith('group:')) {
							uniqueGroups.add(groupSubject.substring(6));
						}
					}
				} catch (e) {
					// Ignore parsing errors
				}
			}
		}));

		// Convert set to array
		const result = { groups: Array.from(uniqueGroups) };

		// Cache the result
		const cacheResponse = new Response(JSON.stringify(result), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': `max-age=${this.CACHE_TTL.RELATIONSHIP}`
			}
		});

		await this.cache.put(cacheKey, cacheResponse);

		return result;
	}

	// Create or update a role definition
	async defineRole(request: DefineRoleRequest): Promise<SuccessResponse> {
		// Validate request
		const validatedData = DefineRoleRequestSchema.parse(request);
		const { type, role, permissions, inherits } = validatedData;

		const key: RoleDefKey = `role_def:${type}:${role}`;
		const roleDef: RoleDefinition = { permissions, inherits };
		await this.env.PERMISSIONS_KV.put(key, JSON.stringify(roleDef));

		// Invalidate any cached role definitions
		await this.cache.delete(this.cacheKey('role-def', type, role));
		await this.cache.delete(this.cacheKey('roles-list', type));
		return { ok: true };
	}

	// Delete a role definition
	async deleteRole(request: DeleteRoleRequest): Promise<SuccessResponse> {
		// Validate request
		const validatedData = DeleteRoleRequestSchema.parse(request);
		const { type, role } = validatedData;

		// Check if the role exists first
		const key: RoleDefKey = `role_def:${type}:${role}`;
		const roleDefStr = await this.env.PERMISSIONS_KV.get(key);

		if (!roleDefStr) {
			// Role doesn't exist, return success anyway
			return { ok: true };
		}

		// Delete the role from KV
		await this.env.PERMISSIONS_KV.delete(key);

		// Invalidate caches
		await this.cache.delete(this.cacheKey('role-def', type, role));
		await this.cache.delete(this.cacheKey('roles-list', type));

		return { ok: true };
	}

	// List all roles for a given type
	async listRoles(request: ListRolesRequest): Promise<ListRolesResponse> {
		// Validate request
		const validatedData = ListRolesRequestSchema.parse(request);
		const { type } = validatedData;

		// Try to get from cache first
		const cacheKey = this.cacheKey('roles-list', type);
		const cachedRoles = await this.cache.match(cacheKey);
		if (cachedRoles) {
			return cachedRoles.json() as Promise<ListRolesResponse>;
		}

		// List all keys matching the role definition prefix
		const keyPrefix = `role_def:${type}:`;
		const listResult = await this.env.PERMISSIONS_KV.list({ prefix: keyPrefix });

		const roles: Record<string, RoleDefinition> = {};

		// Fetch all role definitions
		await Promise.all(listResult.keys.map(async (keyObj) => {
			const key = keyObj.name;
			const roleName = key.substring(keyPrefix.length); // Extract role name from key

			const roleDefStr = await this.env.PERMISSIONS_KV.get(key);
			if (roleDefStr) {
				const roleDef = JSON.parse(roleDefStr) as RoleDefinition;
				roles[roleName] = roleDef;
			}
		}));

		const result = { roles };

		// Cache the result
		const cacheResponse = new Response(JSON.stringify(result), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': `max-age=${this.CACHE_TTL.ROLE_DEF}`
			}
		});

		await this.cache.put(cacheKey, cacheResponse);

		return result;
	}

	// Grant a role to subject on object
	async grantRole(request: GrantRoleRequest): Promise<SuccessResponse> {
		// Validate request
		const validatedData = GrantRoleRequestSchema.parse(request);
		const { subject, type, id, role, expires_at } = validatedData;

		const key: RelationshipKey = `rel:${type}:${id}`;
		const relValue = await this.getRelationship(type, id);

		// Handle user vs group subjects
		if (subject.startsWith("user:")) {
			relValue.direct[subject] = role;
			if (expires_at) {
				relValue.expires_at = relValue.expires_at || {};
				relValue.expires_at[subject] = expires_at;
			}
		} else if (subject.startsWith("group:")) {
			relValue.groups[subject] = role;
			if (expires_at) {
				relValue.expires_at = relValue.expires_at || {};
				relValue.expires_at[subject] = expires_at;
			}
		}

		await this.env.PERMISSIONS_KV.put(key, JSON.stringify(relValue));

		// Invalidate relationship cache
		await this.cache.delete(this.cacheKey('rel', type, id));
		await this.cache.delete(this.cacheKey('all-group-permissions', type, id));

		// Also invalidate permission cache for this user/group
		if (subject.startsWith("user:")) {
			const user = subject.split(":")[1];
			await this.cache.delete(this.cacheKey('perm', user, type, id, '*'));
		}

		return { ok: true };
	}

	// Remove a role from subject on object
	async revokeRole(request: RevokeRoleRequest): Promise<SuccessResponse> {
		// Validate request
		const validatedData = RevokeRoleRequestSchema.parse(request);
		const { subject, type, id } = validatedData;

		const key: RelationshipKey = `rel:${type}:${id}`;
		const relValue = await this.getRelationship(type, id);

		if (subject.startsWith("user:") && relValue.direct[subject]) {
			delete relValue.direct[subject];
		} else if (subject.startsWith("group:") && relValue.groups[subject]) {
			delete relValue.groups[subject];
		}

		if (relValue.expires_at?.[subject]) {
			delete relValue.expires_at[subject];
		}

		await this.env.PERMISSIONS_KV.put(key, JSON.stringify(relValue));

		// Invalidate relationship cache
		await this.cache.delete(this.cacheKey('rel', type, id));
		await this.cache.delete(this.cacheKey('all-group-permissions', type, id));

		return { ok: true };
	}

	// Add user to group
	async addToGroup(request: GroupMembershipRequest): Promise<SuccessResponse> {
		// Validate request
		const validatedData = GroupMembershipRequestSchema.parse(request);
		const { user, group } = validatedData;

		const userKey = `${user}` as Subject;
		const groupKey = `group:${group}` as Subject;
		const key: GroupMembershipKey = `group_membership:user:${userKey}`;

		let groupMemberships: Subject[] = [];
		const existingValue = await this.env.PERMISSIONS_KV.get(key);

		if (existingValue) {
			groupMemberships = JSON.parse(existingValue);
		}

		if (!groupMemberships.includes(groupKey)) {
			groupMemberships.push(groupKey);
		}

		await this.env.PERMISSIONS_KV.put(key, JSON.stringify(groupMemberships));

		// Invalidate group cache
		await this.cache.delete(this.cacheKey('groups', user));

		return { ok: true };
	}

	// Remove user from group
	async removeFromGroup(request: GroupMembershipRequest): Promise<SuccessResponse> {
		// Validate request
		const validatedData = GroupMembershipRequestSchema.parse(request);
		const { user, group } = validatedData;

		const userKey = `${user}` as Subject;
		const groupKey = `group:${group}` as Subject;
		const key: GroupMembershipKey = `group_membership:user:${userKey}`;

		const existingValue = await this.env.PERMISSIONS_KV.get(key);
		if (!existingValue) return { ok: true };

		const groupMemberships = JSON.parse(existingValue) as Subject[];
		const filteredGroups = groupMemberships.filter(g => g !== groupKey);

		await this.env.PERMISSIONS_KV.put(key, JSON.stringify(filteredGroups));

		// Invalidate group cache
		await this.cache.delete(this.cacheKey('groups', user));

		return { ok: true };
	}

	// Core check permission function with caching
	async checkPermission(request: CheckPermissionRequest): Promise<PermissionResult> {
		// Validate request
		const validatedData = CheckPermissionRequestSchema.parse(request);
		const { user, type, id, permission, bypassCache } = validatedData;

		const cacheKey = this.cacheKey('perm', user, type, id, permission);

		// Try to get from cache first
		if (!bypassCache) {
			const cachedResult = await this.cache.match(cacheKey);
			if (cachedResult) {
				const result = await cachedResult.json() as CachedPermissionResult;

				// If cache is still fresh (based on our TTL)
				if (Date.now() - result.cachedAt < this.CACHE_TTL.PERMISSIONS * 1000) {
					return {
						allowed: result.allowed,
						permissions: result.permissions,
						cached: true
					};
				}
			}
		}

		const userKey = `user:${user}` as Subject;

		// Step 1: Get user's group memberships (with caching)
		const groupMemberships = await this.getUserGroups(user);

		// Step 2: Get object relationships (with caching)
		const relValue = await this.getRelationship(type, id);

		// Step 3: Collect roles (direct + via groups)
		const roles: Set<Role> = new Set();
		const now = Date.now();

		// Check direct roles (if not expired)
		if (relValue.direct[userKey] &&
			(!relValue.expires_at?.[userKey] || relValue.expires_at[userKey] > now)) {
			roles.add(relValue.direct[userKey]);
		}

		// Check group roles
		for (const group of groupMemberships) {
			if (relValue.groups[group] &&
				(!relValue.expires_at?.[group] || relValue.expires_at[group] > now)) {
				roles.add(relValue.groups[group]);
			}
		}

		// Step 4: Resolve role inheritance and permissions (with caching)
		const permissions = await this.expandRolesPermissions(Array.from(roles), type);

		const result = {
			allowed: permissions.includes(permission),
			permissions,
			cached: false
		};

		// Cache the result
		const cacheData: CachedPermissionResult = {
			allowed: result.allowed,
			permissions: result.permissions,
			cachedAt: Date.now()
		};

		const cacheResponse = new Response(JSON.stringify(cacheData), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': `max-age=${this.CACHE_TTL.PERMISSIONS}`
			}
		});

		await this.cache.put(cacheKey, cacheResponse);

		return result;
	}

	// Helper to get user groups with caching
	private async getUserGroups(user: string): Promise<Subject[]> {
		const userKey = `user:${user}` as Subject;
		const cacheKey = this.cacheKey('groups', user);

		// Try to get from cache first
		const cachedGroups = await this.cache.match(cacheKey);
		if (cachedGroups) {
			return cachedGroups.json() as Promise<Subject[]>;
		}

		// If not in cache, fetch from KV
		const groupMembershipKey: GroupMembershipKey = `group_membership:${userKey}`;
		const groupMembershipsStr = await this.env.PERMISSIONS_KV.get(groupMembershipKey) || "[]";
		const groups = JSON.parse(groupMembershipsStr) as Subject[];

		// Cache the groups
		const cacheResponse = new Response(JSON.stringify(groups), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': `max-age=${this.CACHE_TTL.RELATIONSHIP}`
			}
		});

		await this.cache.put(cacheKey, cacheResponse);

		return groups;
	}

	// Helper to get relationship data with caching
	private async getRelationship(type: string, id: string): Promise<RelationshipTuple> {
		const key: RelationshipKey = `rel:${type}:${id}`;
		const cacheKey = this.cacheKey('rel', type, id);

		// Try to get from cache first
		const cachedRel = await this.cache.match(cacheKey);
		if (cachedRel) {
			return cachedRel.json() as Promise<RelationshipTuple>;
		}

		// If not in cache, fetch from KV
		const existingValue = await this.env.PERMISSIONS_KV.get(key);

		let relValue: RelationshipTuple;
		if (existingValue) {
			relValue = JSON.parse(existingValue);
		} else {
			relValue = { direct: {}, groups: {} };
		}

		// Cache the relationship data
		const cacheResponse = new Response(JSON.stringify(relValue), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': `max-age=${this.CACHE_TTL.RELATIONSHIP}`
			}
		});

		await this.cache.put(cacheKey, cacheResponse);

		return relValue;
	}

	// Helper to expand roles to permissions with caching
	private async expandRolesPermissions(roles: Role[], objectType: string): Promise<Permission[]> {
		const allPermissions: Set<Permission> = new Set();
		const processedRoles: Set<Role> = new Set();
		const roleQueue: Role[] = [...roles];

		while (roleQueue.length > 0) {
			const role = roleQueue.shift()!;
			if (processedRoles.has(role)) continue;
			processedRoles.add(role);

			// Try to get role definition from cache
			const cacheKey = this.cacheKey('role-def', objectType, role);
			const cachedRoleDef = await this.cache.match(cacheKey);

			let roleDef: RoleDefinition | null = null;

			if (cachedRoleDef) {
				roleDef = await cachedRoleDef.json() as RoleDefinition;
			} else {
				// If not in cache, fetch from KV
				const key: RoleDefKey = `role_def:${objectType}:${role}`;
				const roleDefStr = await this.env.PERMISSIONS_KV.get(key);

				if (roleDefStr) {
					roleDef = JSON.parse(roleDefStr);

					// Cache the role definition
					const cacheResponse = new Response(JSON.stringify(roleDef), {
						headers: {
							'Content-Type': 'application/json',
							'Cache-Control': `max-age=${this.CACHE_TTL.ROLE_DEF}`
						}
					});

					await this.cache.put(cacheKey, cacheResponse);
				}
			}

			if (roleDef) {
				// Add direct permissions
				for (const permission of roleDef.permissions) {
					allPermissions.add(permission);
				}

				// Queue inherited roles
				for (const inheritedRole of roleDef.inherits) {
					if (!processedRoles.has(inheritedRole)) {
						roleQueue.push(inheritedRole);
					}
				}
			}
		}

		return Array.from(allPermissions);
	}

	// Get user roles for a specific document type
	async getUserRoles(user: string, type: PermissionDocType): Promise<{ roles: { type: PermissionDocType; id: string; role: string; expires_at: number | null }[] }> {
		// List all keys matching the relationship prefix for this type
		const keyPrefix = `rel:${type}:`;
		const listResult = await this.env.PERMISSIONS_KV.list({ prefix: keyPrefix });
		
		const roles: { type: PermissionDocType; id: string; role: string; expires_at: number | null }[] = [];
		const userSubject = `user:${user}`;
		const now = Date.now();
		
		// Check each relationship for direct user permissions
		for (const keyObj of listResult.keys) {
			const relKey = keyObj.name;
			// Extract id from 'rel:type:id'
			const id = relKey.substring(keyPrefix.length);
			
			const relStr = await this.env.PERMISSIONS_KV.get(relKey);
			if (relStr) {
				try {
					const rel = JSON.parse(relStr) as RelationshipTuple;
					
					// Check if user has direct permission and it's not expired
					if (rel.direct && rel.direct[userSubject]) {
						const expiresAt = rel.expires_at?.[userSubject];
						if (!expiresAt || expiresAt > now) {
							roles.push({
								type,
								id,
								role: rel.direct[userSubject],
								expires_at: expiresAt || null
							});
						}
					}
				} catch (e) {
					// Ignore parsing errors
					console.error('Error parsing relationship:', e);
				}
			}
		}
		
		return { roles };
	}

	// Grant a role to subject on multiple objects
	async grantRoleToMultiple(request: GrantRoleToMultipleRequest): Promise<SuccessResponse> {
		// Validate request
		const validatedData = GrantRoleToMultipleRequestSchema.parse(request);
		const { subject, type, ids, role, expires_at } = validatedData;

		// Process each object ID in parallel
		await Promise.all(ids.map(async (id) => {
			const key: RelationshipKey = `rel:${type}:${id}`;
			const relValue = await this.getRelationship(type, id);

			// Handle user vs group subjects
			if (subject.startsWith("user:")) {
				relValue.direct[subject] = role;
				if (expires_at) {
					relValue.expires_at = relValue.expires_at || {};
					relValue.expires_at[subject] = expires_at;
				}
			} else if (subject.startsWith("group:")) {
				relValue.groups[subject] = role;
				if (expires_at) {
					relValue.expires_at = relValue.expires_at || {};
					relValue.expires_at[subject] = expires_at;
				}
			}

			await this.env.PERMISSIONS_KV.put(key, JSON.stringify(relValue));

			// Invalidate relationship cache
			await this.cache.delete(this.cacheKey('rel', type, id));
			await this.cache.delete(this.cacheKey('all-group-permissions', type, id));

			// Also invalidate permission cache for this user/group
			if (subject.startsWith("user:")) {
				const user = subject.split(":")[1];
				await this.cache.delete(this.cacheKey('perm', user, type, id, '*'));
			}
		}));

		return { ok: true };
	}
}

export class PermissionService extends WorkerEntrypoint<Bindings> {
	async newPermissionManager() {
		return new PermissionManager(this.env);
	}
}

export default {
	async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
		// For API calls, we'd implement proper routing and cache management
		// This is just a simple example of the default response
		return new Response("Permission Manager API running", {
			headers: {
				'Content-Type': 'text/plain',
				'Cache-Control': 'public, max-age=60'
			}
		});
	},
};
