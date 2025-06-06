import {HonoApp} from "../../type";
import createUser from "./handler/createUser";
import deleteUser from "./handler/deleteUser";
import getUser from "./handler/getUser";
import getUsers from "./handler/getUsers";
import updateUser from "./handler/updateUser";
import userMe from "./handler/userMe";

export default function userRoute(app: HonoApp) {
  createUser(app)
  getUser(app)
  getUsers(app)
  updateUser(app)
  userMe(app)
  deleteUser(app)
}
