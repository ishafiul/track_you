import {WorkerEntrypoint} from "cloudflare:workers";
import { Env } from "./config/context";
import {Location} from "./service/location_service";



export class LocationService extends WorkerEntrypoint<Env> {
	async newLocation() {

		return new Location(this.env);
	}
}


export default {
	fetch() {
		return new Response("Location Service")
	}
}


