import {z} from '@hono/zod-openapi'

export const GetUsersSchema = z.object({
	limit: z.coerce.number().default(10),
	pageNumber: z.coerce.number().default(1),
	role: z.enum(['admin', 'user']).optional(),
	sortBy: z.enum(['role', 'email', 'id']).optional().default('id'),
	sort: z.enum(['asc', 'desc']).optional(),
}).openapi('GetUsersDto')

export type GetUsersDto = z.infer<typeof GetUsersSchema>;
