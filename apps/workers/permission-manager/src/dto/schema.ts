import {z} from "@hono/zod-openapi";
import {
	SubjectSchema,
	ObjectIdSchema,
	RoleSchema,
	PermissionSchema, PermissionDocTypeSchema, RoleDefinition
} from "../entity/schema";

// Request schemas
export const DefineRoleRequestSchema = z.object({
	type: PermissionDocTypeSchema,
	role: RoleSchema,
	permissions: z.array(PermissionSchema),
	inherits: z.array(RoleSchema).optional().default([])
});

export const GrantRoleRequestSchema = z.object({
	subject: SubjectSchema,
	type: PermissionDocTypeSchema,
	id: ObjectIdSchema,
	role: RoleSchema,
	expires_at: z.number().nullable().optional().default(null)
});

export const RevokeRoleRequestSchema = z.object({
	subject: SubjectSchema,
	type: PermissionDocTypeSchema,
	id: ObjectIdSchema
});

export const GroupMembershipRequestSchema = z.object({
	user: z.string().min(1),
	group: z.string().min(1)
});

export const CheckPermissionRequestSchema = z.object({
	user: z.string().min(1),
	type: PermissionDocTypeSchema,
	id: ObjectIdSchema,
	permission: PermissionSchema,
	bypassCache: z.boolean().optional().default(false)
});

// Added schema for listing roles
export const ListRolesRequestSchema = z.object({
	type: PermissionDocTypeSchema
});

// Added schema for deleting a role
export const DeleteRoleRequestSchema = z.object({
	type: PermissionDocTypeSchema,
	role: RoleSchema
});

// Added schema for getting group members
export const GetGroupMembersRequestSchema = z.object({
	group: z.string().min(1)
});

// Added schema for getting group permissions
export const GetGroupPermissionsRequestSchema = z.object({
	group: z.string().optional()
});

export const GrantRoleToMultipleRequestSchema = z.object({
	subject: SubjectSchema,
	type: PermissionDocTypeSchema,
	ids: z.array(ObjectIdSchema),
	role: RoleSchema,
	expires_at: z.number().nullable().optional().default(null)
});

// Response schemas
export const PermissionResultSchema = z.object({
	allowed: z.boolean(),
	permissions: z.array(PermissionSchema),
	cached: z.boolean().optional()
});

export const SuccessResponseSchema = z.object({
	ok: z.boolean()
});

// Added response schema for listing roles
export const ListRolesResponseSchema = z.object({
	roles: z.record(z.string(), z.object({
		permissions: z.array(PermissionSchema),
		inherits: z.array(RoleSchema)
	}))
});

// Added response schema for listing groups
export const ListGroupsResponseSchema = z.object({
	groups: z.array(z.string())
});

// Added response schema for group members
export const GetGroupMembersResponseSchema = z.object({
	users: z.array(z.string())
});

// Schema for an individual resource permission
const ResourcePermissionSchema = z.object({
	type: PermissionDocTypeSchema,
	id: z.string(),
	role: z.string(),
	expires_at: z.number().nullable().optional()
});

// Added response schema for group permissions
export const GetGroupPermissionsResponseSchema = z.object({
	groups: z.record(z.string(), z.array(ResourcePermissionSchema))
});

// Export TypeScript types
export type DefineRoleRequest = z.infer<typeof DefineRoleRequestSchema>;
export type GrantRoleRequest = z.infer<typeof GrantRoleRequestSchema>;
export type RevokeRoleRequest = z.infer<typeof RevokeRoleRequestSchema>;
export type GroupMembershipRequest = z.infer<typeof GroupMembershipRequestSchema>;
export type CheckPermissionRequest = z.infer<typeof CheckPermissionRequestSchema>;
export type ListRolesRequest = z.infer<typeof ListRolesRequestSchema>;
export type DeleteRoleRequest = z.infer<typeof DeleteRoleRequestSchema>;
export type GetGroupMembersRequest = z.infer<typeof GetGroupMembersRequestSchema>;
export type GetGroupPermissionsRequest = z.infer<typeof GetGroupPermissionsRequestSchema>;
export type PermissionResult = z.infer<typeof PermissionResultSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ListRolesResponse = z.infer<typeof ListRolesResponseSchema>;
export type ListGroupsResponse = z.infer<typeof ListGroupsResponseSchema>;
export type GetGroupMembersResponse = z.infer<typeof GetGroupMembersResponseSchema>;
export type ResourcePermission = z.infer<typeof ResourcePermissionSchema>;
export type GetGroupPermissionsResponse = z.infer<typeof GetGroupPermissionsResponseSchema>;
export type GrantRoleToMultipleRequest = z.infer<typeof GrantRoleToMultipleRequestSchema>;
