import { HonoApp } from '../../type';
import getApiKeyUsage from './handler/getApiKeyUsage';
import getUsageEvents from './handler/getUsageEvents';
import getUsageOverview from './handler/getUsageOverview';
import getUserDashboard from './handler/getUserDashboard';

export default function analyticsRoute(app: HonoApp) {
  getUsageEvents(app);
  getUserDashboard(app);
  getApiKeyUsage(app);
  getUsageOverview(app);
}
