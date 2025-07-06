import { HonoApp } from '../../type';
import generateApiKey from './handler/generateApiKey';
import getApiKeys from './handler/getApiKeys';
import revokeApiKey from './handler/revokeApiKey';
import getApiKeyAnalytics from './handler/getApiKeyAnalytics';

export default function apiKeysRoute(app: HonoApp) {
  generateApiKey(app);
  getApiKeys(app);
  revokeApiKey(app);
  getApiKeyAnalytics(app);
}
