import { HonoApp } from "../../type";
import getContent from "./handler/getData";
import updateContent from "./handler/updateContent";

export default (app: HonoApp) => {
  getContent(app);
  updateContent(app);
};
