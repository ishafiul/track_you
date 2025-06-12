import {DB} from "../db";

export type Env = {
	ENVIRONMENT: string;
	POSTGRES_CONNECTION_STRING: string;
};

export type HonoTypes = {
	Bindings: Env;
	Variables: {
		db: DB;
	};
};


