import {z} from "@hono/zod-openapi";

export const PermissionDocTypeSchema = z.enum(['user', 'blog']).openapi('PermissionDocType');

export type PermissionDocType = z.infer<typeof PermissionDocTypeSchema>;

// Core entity schemas
export const SubjectSchema = z.union([
	z.string().regex(/^user:[a-zA-Z0-9_-]+$/),
	z.string().regex(/^group:[a-zA-Z0-9_-]+$/)
]);

//export const ObjectTypeSchema = z.string().min(1);
export const ObjectIdSchema = z.string().min(1);
export const RoleSchema = z.string().min(1);
export const PermissionSchema = z.enum(['view', 'edit', 'admin', 'delete', 'create', 'owner']);

export const RelationshipTupleSchema = z.object({
	direct: z.record(SubjectSchema, RoleSchema),
	groups: z.record(SubjectSchema, RoleSchema),
	expires_at: z.record(SubjectSchema, z.number()).optional()
});

export const RoleDefinitionSchema = z.object({
	permissions: z.array(PermissionSchema),
	inherits: z.array(RoleSchema)
});

// Export TypeScript types
export type Subject = z.infer<typeof SubjectSchema>;
//export type ObjectType = z.infer<typeof ObjectTypeSchema>;
export type ObjectId = z.infer<typeof ObjectIdSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type RelationshipTuple = z.infer<typeof RelationshipTupleSchema>;
export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;
