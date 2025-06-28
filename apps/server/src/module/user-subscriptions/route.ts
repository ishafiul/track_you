import { HonoApp } from "../../type";
import cancelUserSubscription from "./handler/cancelUserSubscription";
import checkUserAccess from "./handler/checkUserAccess";
import createUserSubscription from "./handler/createUserSubscription";
import deleteUserSubscription from "./handler/deleteUserSubscription";
import getExpiringSubscriptions from "./handler/getExpiringSubscriptions";
import getSubscriptionsByPlan from "./handler/getSubscriptionsByPlan";
import getUserActiveSubscription from "./handler/getUserActiveSubscription";
import getUserSubscription from "./handler/getUserSubscription";
import getUserSubscriptions from "./handler/getUserSubscriptions";
import reactivateUserSubscription from "./handler/reactivateUserSubscription";
import renewSubscription from "./handler/renewSubscription";
import subscribeUserToPlan from "./handler/subscribeUserToPlan";
import updateUserSubscription from "./handler/updateUserSubscription";
import upgradePlan from "./handler/upgradePlan";


export default function userSubscriptionsRoute(app: HonoApp) {
  createUserSubscription(app);
  getUserSubscription(app);
  getUserSubscriptions(app);
  getUserActiveSubscription(app);
  getSubscriptionsByPlan(app);
  getExpiringSubscriptions(app);
  updateUserSubscription(app);
  cancelUserSubscription(app);
  reactivateUserSubscription(app);
  deleteUserSubscription(app);
  subscribeUserToPlan(app);
  upgradePlan(app);
  renewSubscription(app);
  checkUserAccess(app);
} 