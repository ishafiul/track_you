import { HonoApp } from "../../type";
import createSubscriptionPlan from "./handler/createSubscriptionPlan";
import createPaymentLink from "./handler/createPaymentLink";
import deactivateSubscriptionPlan from "./handler/deactivateSubscriptionPlan";
import deleteSubscriptionPlan from "./handler/deleteSubscriptionPlan";
import getActiveSubscriptionPlans from "./handler/getActiveSubscriptionPlans";
import getActiveSubscriptionPlansWithPricing from "./handler/getActiveSubscriptionPlansWithPricing";
import getAllSubscriptionPlans from "./handler/getAllSubscriptionPlans";
import getSubscriptionPlan from "./handler/getSubscriptionPlan";
import updateSubscriptionPlan from "./handler/updateSubscriptionPlan";
import createCheckoutSession from "./handler/createCheckoutSession";

export default function subscriptionPlansRoute(app: HonoApp) {
  // Register specific routes first (before parameterized routes)
  createPaymentLink(app);
  getAllSubscriptionPlans(app);
  getActiveSubscriptionPlans(app);
  getActiveSubscriptionPlansWithPricing(app);
  createCheckoutSession(app);
  // Register parameterized routes last
  createSubscriptionPlan(app);
  getSubscriptionPlan(app);
  updateSubscriptionPlan(app);
  deactivateSubscriptionPlan(app);
  deleteSubscriptionPlan(app);
} 