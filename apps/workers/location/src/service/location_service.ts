import { RpcTarget } from "cloudflare:workers";
import {Env} from "../config/context";
import {getDb} from "../db";
import { locations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

export type LocationData = {
	latitude: string;
	longitude: string;
	altitude: string;
	accuracy: string;
	bearing: string;
	timestamp: string;
	userId: string;
	subscriptionId: string;
};

export class Location extends RpcTarget {
	#env: Env;
	private readonly db;

	constructor(env: Env) {
		super();
		this.#env = env;
		this.db = getDb(env);
	}

	async insertLocation(locationData: LocationData) {
		try {
			const id = uuidv4();
			await this.db.insert(locations).values({
				id: id,
				latitude: locationData.latitude,
				longitude: locationData.longitude,
				altitude: locationData.altitude,
				accuracy: locationData.accuracy,
				bearing: locationData.bearing,
				timestamp: locationData.timestamp,
				userId: locationData.userId,
				subscriptionId: locationData.subscriptionId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			return { success: true, id };
		} catch (error) {
			console.error("Error inserting location:", error);
			return { success: false, error: (error as Error).message };
		}
	}

	async getLocationsByUserId(userId: string) {
		try {
			const userLocations = await this.db
				.select()
				.from(locations)
				.where(eq(locations.userId, userId))
				.orderBy(locations.timestamp);

			return { success: true, locations: userLocations };
		} catch (error) {
			console.error("Error fetching locations:", error);
			return { success: false, error: (error as Error).message };
		}
	}
}
