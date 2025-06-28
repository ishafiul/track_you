import {WorkerEntrypoint} from "cloudflare:workers";
import {Bindings} from "./config/bindings";
import {Billing} from "./service/billingService";

export class BillingService extends WorkerEntrypoint<Bindings> {
	async billing() {
		return new Billing(this.env);
	}
}


export default {
	fetch() {
		return new Response("Billing Service")
	}
}


