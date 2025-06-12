import { HonoApp } from "../../type";
import getLcoation from "./handler/getLcoation";
import insertLocation from "./handler/insertLocation";

export default function locationRoute(app: HonoApp) {
  getLcoation(app);
  insertLocation(app);
}