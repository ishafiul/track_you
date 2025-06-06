import {HonoApp} from "../../type";
import setRole from "./handler/setRole";
import getRoles from "./handler/getRoles";
import getRole from "./handler/getRole";
import deleteRole from "./handler/deleteRole";
import editRoles from "./handler/editRoles";
import getDocType from "./handler/getDocType";
import setPermission from "./handler/setPermission";
import revokePermission from "./handler/revokePermission";
import getGroupMembers from "./handler/getGroupMembers";
import getGroupPermissions from "./handler/getGroupPermissions";
import listGroups from "./handler/listGroups";
import addToGroup from "./handler/addToGroup";
import removeFromGroup from "./handler/removeFromGroup";
import getUserRoles from "./handler/getUserRoles";
import getUserGroups from "./handler/getUserGroups";
import checkBlogPermissions from "./handler/checkBlogPermissions";
import grantRoleToMultiple from "./handler/grantRoleToMultiple";

export default function permissionRoute(app: HonoApp) {
  getDocType(app)
  setRole(app)
  getRoles(app)
  getRole(app)
  editRoles(app)
  deleteRole(app)
  setPermission(app)
  revokePermission(app)
  listGroups(app)
  addToGroup(app)
  removeFromGroup(app)
  getGroupMembers(app)
  getGroupPermissions(app)
  getUserRoles(app)
  getUserGroups(app)
  checkBlogPermissions(app)
  grantRoleToMultiple(app)
}
