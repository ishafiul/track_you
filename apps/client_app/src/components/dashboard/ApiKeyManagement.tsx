import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy, Eye, EyeOff, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { httpClient } from '@/lib/http-client';
import { useAuth } from '@/lib/auth-context';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface ApiKeyGenerationResponse {
  success: boolean;
  data?: {
    keyId: string;
    apiKey: string;
    name: string;
    permissions: string[];
    expiresAt: string | null;
  };
  error?: string;
}

export function ApiKeyManagement() {
  const { tokens } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    permissions: ['location:read', 'location:write'],
    expiresAt: '',
  });

  useEffect(() => {
    if (tokens?.userId) {
      fetchApiKeys();
    }
  }, [tokens?.userId]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get<{ success: boolean; data: ApiKey[] }>('/api-keys');
      if (response.success) {
        setApiKeys(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setMessage({ type: 'error', text: 'Failed to load API keys' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name for your API key' });
      return;
    }

    try {
      setGenerating(true);
      const response = await httpClient.post<ApiKeyGenerationResponse>('/api-keys/generate', {
        name: formData.name,
        permissions: formData.permissions,
        expiresAt: formData.expiresAt || undefined,
      });

      if (response.success && response.data) {
        setNewApiKey(response.data.apiKey);
        setShowKey(response.data.keyId);
        setMessage({ type: 'success', text: 'API key generated successfully!' });
        setShowForm(false);
        setFormData({ name: '', permissions: ['location:read', 'location:write'], expiresAt: '' });
        await fetchApiKeys();
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to generate API key' });
      }
    } catch (error: any) {
      console.error('Error generating API key:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to generate API key',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (
      !window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')
    ) {
      return;
    }

    try {
      const response = await httpClient.delete<{ success: boolean; message?: string }>(
        `/api-keys/${keyId}`
      );
      if (response.success) {
        setMessage({ type: 'success', text: 'API key revoked successfully' });
        await fetchApiKeys();
      } else {
        setMessage({ type: 'error', text: 'Failed to revoke API key' });
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      setMessage({ type: 'error', text: 'Failed to revoke API key' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'API key copied to clipboard' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>Loading your API keys...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
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
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
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

      {/* New API Key Display */}
      {newApiKey && showKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">New API Key Generated</CardTitle>
            <CardDescription className="text-green-600">
              Make sure to copy your API key now. You won't be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg">
              <code className="flex-1 text-sm font-mono text-green-800 break-all">{newApiKey}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newApiKey)}
                className="text-green-700 border-green-300 hover:bg-green-200"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewApiKey(null);
                setShowKey(null);
              }}
              className="mt-3 text-green-700 border-green-300 hover:bg-green-200"
            >
              I've copied the key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Manage your API keys for accessing TrackYou services
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} disabled={generating} className="gap-2">
              <Plus className="h-4 w-4" />
              New API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Generate Form */}
          {showForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">API Key Name</Label>
                  <Input
                    id="keyName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Production App, Mobile App"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="permissions">Permissions</Label>
                  <div className="mt-2 space-y-2">
                    {['location:read', 'location:write'].map((permission) => (
                      <label key={permission} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, permission],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permissions: formData.permissions.filter((p) => p !== permission),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={handleGenerateKey} disabled={generating} className="gap-2">
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      'Generate API Key'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={generating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className="space-y-4">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No API keys found. Create your first API key to get started.</p>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={`p-4 border rounded-lg ${
                    !key.isActive || isExpired(key.expiresAt) ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{key.name}</h3>
                        <Badge
                          variant={
                            key.isActive
                              ? isExpired(key.expiresAt)
                                ? 'destructive'
                                : 'default'
                              : 'secondary'
                          }
                        >
                          {!key.isActive
                            ? 'Revoked'
                            : isExpired(key.expiresAt)
                            ? 'Expired'
                            : 'Active'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Key:</span> {key.keyPrefix}...
                        </p>
                        <p>
                          <span className="font-medium">Permissions:</span>{' '}
                          {key.permissions.join(', ')}
                        </p>
                        <p>
                          <span className="font-medium">Created:</span> {formatDate(key.createdAt)}
                        </p>
                        {key.expiresAt && (
                          <p>
                            <span className="font-medium">Expires:</span>{' '}
                            {formatDate(key.expiresAt)}
                          </p>
                        )}
                        {key.lastUsed && (
                          <p>
                            <span className="font-medium">Last used:</span>{' '}
                            {formatRelativeTime(key.lastUsed)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {key.isActive && !isExpired(key.expiresAt) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
