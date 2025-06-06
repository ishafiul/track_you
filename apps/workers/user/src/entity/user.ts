import {z} from '@hono/zod-openapi'
import { selectUsersSchema } from '../../drizzle/schema';

export const UserSchema = z.object(selectUsersSchema.shape).openapi('UserEntity')

export type UserEntity = z.infer<typeof UserSchema>;

export const UserListSchema = z.object({
	users: z.array(UserSchema),
	pagination: z.object({
		total: z.number(),
		pageNumber: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	}),
}).openapi('UserListEntity')

export type UserListEntity = z.infer<typeof UserListSchema>;
