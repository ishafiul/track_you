import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
  Database,
  Target,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { httpClient } from '@/lib/http-client';
import { useAuth } from '@/lib/auth-context';

interface DashboardStats {
  totalApiKeys: number;
  activeApiKeys: number;
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  successRate: number;
  averageResponseTime: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    percentage: number;
  }>;
  recentUsage: Array<{
    date: string;
    requests: number;
    errors: number;
  }>;
}

interface UsageOverview {
  period: string;
  totalApiKeys: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageResponseTime: number;
  totalDataTransferred: number;
  dailyBreakdown: Array<{
    date: string;
    requests: number;
    successRate: number;
    averageResponseTime: number;
  }>;
  topApiKeys: Array<{
    keyId: string;
    keyName: string;
    requests: number;
    percentage: number;
  }>;
  statusCodeBreakdown: Array<{
    statusCode: number;
    count: number;
    percentage: number;
  }>;
}

export function AnalyticsDashboard() {
  const { tokens } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [usageOverview, setUsageOverview] = useState<UsageOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (tokens?.userId) {
      fetchAnalyticsData();
    }
  }, [tokens?.userId, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, overviewResponse] = await Promise.all([
        httpClient.get<{ success: boolean; data: DashboardStats }>('/analytics/dashboard'),
        httpClient.get<{ success: boolean; data: UsageOverview }>(
          `/analytics/overview?period=${selectedPeriod}`
        ),
      ]);

      if (dashboardResponse.success) {
        setDashboardStats(dashboardResponse.data);
      }
      if (overviewResponse.success) {
        setUsageOverview(overviewResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setMessage({ type: 'error', text: 'Failed to load analytics data' });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const getStatusCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-green-500';
    if (code >= 300 && code < 400) return 'bg-yellow-500';
    if (code >= 400 && code < 500) return 'bg-orange-500';
    if (code >= 500) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusCodeName = (code: number) => {
    const codes: { [key: number]: string } = {
      200: 'OK',
      201: 'Created',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Server Error',
    };
    return codes[code] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                <div className="animate-pulse h-4 w-4 bg-gray-300 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse h-8 w-16 bg-gray-300 rounded mb-2"></div>
                <div className="animate-pulse h-4 w-24 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{message.text}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessage(null)}
            className="text-current hover:bg-current/10 h-auto p-1"
          >
            ×
          </Button>
        </div>
      )}

      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Monitor your API usage and performance</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 days' },
            { value: '30d', label: '30 days' },
            { value: '90d', label: '90 days' },
          ].map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalApiKeys || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.activeApiKeys || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(usageOverview?.totalRequests || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(dashboardStats?.requestsToday || 0)} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(usageOverview?.successRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(usageOverview?.successfulRequests || 0)} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(usageOverview?.averageResponseTime || 0).toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(usageOverview?.totalDataTransferred || 0)} transferred
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Usage Trend
            </CardTitle>
            <CardDescription>API requests over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usageOverview?.dailyBreakdown.slice(-7).map((day, index) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{
                          width: `${Math.max(
                            5,
                            (day.requests /
                              Math.max(
                                ...(usageOverview?.dailyBreakdown.map((d) => d.requests) || [1])
                              )) *
                              100
                          )}%`,
                        }}
                      ></div>
                      <span className="text-sm font-medium">{formatNumber(day.requests)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.successRate.toFixed(1)}% success, {day.averageResponseTime.toFixed(0)}ms
                      avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top API Keys
            </CardTitle>
            <CardDescription>Most used API keys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usageOverview?.topApiKeys.slice(0, 5).map((apiKey, index) => (
                <div key={apiKey.keyId} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{apiKey.keyName}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(apiKey.requests)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${apiKey.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Top Endpoints
            </CardTitle>
            <CardDescription>Most accessed endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardStats?.topEndpoints.slice(0, 5).map((endpoint, index) => (
                <div key={endpoint.endpoint} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-sm">{endpoint.endpoint}</div>
                    <div className="text-xs text-muted-foreground">
                      {endpoint.percentage.toFixed(1)}% of total requests
                    </div>
                  </div>
                  <Badge variant="secondary">{formatNumber(endpoint.requests)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Code Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status Codes
            </CardTitle>
            <CardDescription>Response status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usageOverview?.statusCodeBreakdown.slice(0, 5).map((status) => (
                <div key={status.statusCode} className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusCodeColor(status.statusCode)}`}
                  ></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {status.statusCode} {getStatusCodeName(status.statusCode)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(status.count)} ({status.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Last 7 days of API usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardStats?.recentUsage.slice(-7).map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(day.requests)} requests
                    {day.errors > 0 && (
                      <span className="text-red-600 ml-2">• {day.errors} errors</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={day.errors > 0 ? 'destructive' : 'default'}>
                    {day.errors > 0 ? 'Issues' : 'Healthy'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
