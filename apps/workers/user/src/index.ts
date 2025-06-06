import {WorkerEntrypoint, RpcTarget} from "cloudflare:workers";
import {drizzle, LibSQLDatabase} from "drizzle-orm/libsql";
import {createClient} from "@libsql/client";
import {Bindings} from "./config/bindings";
import {users} from "../drizzle/schema";
import {eq, asc, desc} from "drizzle-orm";
import {v4 as uuidv4} from 'uuid';
import {UserEntity, UserListEntity} from "./entity/user";
import {GetUsersDto, GetUsersSchema} from "./dto/user";

export class User extends RpcTarget {
	#env: Bindings;
	private readonly db: LibSQLDatabase;


	constructor(env: Bindings) {
		super();
		this.#env = env;
		this.db = this.#buildDbClient();
	}

	#buildDbClient(): LibSQLDatabase {
		const url = this.#env.TURSO_URL;
		if (url === undefined) {
			throw new Error('TURSO_URL is not defined');
		}

		const authToken = this.#env.TURSO_AUTH_TOKEN;
		if (authToken === undefined) {
			throw new Error('TURSO_AUTH_TOKEN is not defined');
		}

		return drizzle(createClient({url, authToken}));
	}

	async findUserOrCreate(email: string): Promise<UserEntity> {
		if (this.db === undefined) {
			throw new Error('db is not defined');
		}
		const alreadyExistsUsers = await this.db.select().from(users).where(eq(users.email, email));

		if (alreadyExistsUsers.length === 0) {
			const newCreatedUsers = await this.db.insert(users).values({
				id: uuidv4(),
				email: email
			}).returning();
			return newCreatedUsers[0];
		} else {
			return alreadyExistsUsers[0];
		}
	}

	async findUserByEmail(email: string) {
		if (this.db === undefined) {
			throw new Error('db is not defined');
		}
		const alreadyExistsUsers = await this.db.select().from(users).where(eq(users.email, email));
		return alreadyExistsUsers[0];
	}

	async findUserById(id: string): Promise<UserEntity | null | undefined> {
		if (this.db === undefined) {
			throw new Error('db is not defined');
		}
		const alreadyExistsUsers = await this.db.select().from(users).where(eq(users.id, id));
		return alreadyExistsUsers[0];
	}

	async getUserList(input: GetUsersDto): Promise<UserListEntity> {
		const {pageNumber, limit, role, sortBy, sort} = GetUsersSchema.parse(input);
		if (this.db === undefined) {
			throw new Error('db is not defined');
		}
		const offset = (pageNumber - 1) * limit;
		const order = sort === 'asc' ? asc(users[sortBy]) : desc(users[sortBy]);

		const where = role ? eq(users.role, role) : undefined;

		const data = await this.db
			.select()
			.from(users)
			.where(where)
			.orderBy(order)
			.limit(limit)
			.offset(offset);

		const total = role
			? await this.db.$count(users, eq(users.role, role))
			: await this.db.$count(users);

		return {
			users: data,
			pagination: {
				total,
				pageNumber,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async updateUser(id: string, data: Partial<UserEntity>): Promise<UserEntity | undefined> {
		if (this.db === undefined) {
			throw new Error('db is not defined');
		}
		
		// Only allow updating email and role
		const updateData: Partial<typeof users.$inferInsert> = {};
		if (data.email) updateData.email = data.email;
		if (data.role && (data.role === 'user' || data.role === 'admin')) {
			updateData.role = data.role;
		}
		
		const updatedUsers = await this.db
			.update(users)
			.set(updateData)
			.where(eq(users.id, id))
			.returning();
			
		return updatedUsers[0];
	}

	async deleteUser(id: string): Promise<boolean> {
		if (this.db === undefined) {
			throw new Error('db is not defined');
		}
		
		const result = await this.db
			.delete(users)
			.where(eq(users.id, id))
			.returning({ id: users.id });
			
		return result.length > 0;
	}
}

export class UserService extends WorkerEntrypoint<Bindings> {
	async newUser() {

		return new User(this.env);
	}
}


export default {
	fetch() {
		return new Response("User Service")
	}
}


