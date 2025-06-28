import { HonoApp } from "../../type";
import createSubscriptionPlan from "./handler/createSubscriptionPlan";
import createPaymentLink from "./handler/createPaymentLink";
import deactivateSubscriptionPlan from "./handler/deactivateSubscriptionPlan";
import deleteSubscriptionPlan from "./handler/deleteSubscriptionPlan";
import getActiveSubscriptionPlans from "./handler/getActiveSubscriptionPlans";
import getAllSubscriptionPlans from "./handler/getAllSubscriptionPlans";
import getSubscriptionPlan from "./handler/getSubscriptionPlan";
import updateSubscriptionPlan from "./handler/updateSubscriptionPlan";

export default function subscriptionPlansRoute(app: HonoApp) {
  createSubscriptionPlan(app);
  createPaymentLink(app);
  getSubscriptionPlan(app);
  getAllSubscriptionPlans(app);
  getActiveSubscriptionPlans(app);
  updateSubscriptionPlan(app);
  deactivateSubscriptionPlan(app);
  deleteSubscriptionPlan(app);
} 