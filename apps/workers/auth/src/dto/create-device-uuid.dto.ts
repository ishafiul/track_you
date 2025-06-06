import { z } from '@hono/zod-openapi'
import {InsertDevicesSchema} from "../../drizzle/schema";

export const CreateDeviceUuidSchema = InsertDevicesSchema.omit({id: true}).openapi('CreateDeviceUuidDto')

export type CreateDeviceUuidDto = z.infer<typeof CreateDeviceUuidSchema>;
