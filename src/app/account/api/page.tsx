'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Badge } from '~/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '~/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Plus, Copy, RotateCcw, Trash2, Key, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { ApiKeyListResponse, ApiKeyCreateResponse } from '~/types/apiKeys';

export default function DeveloperPortalPage() {
  const [keys, setKeys] = useState<ApiKeyListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKeyListResponse | null>(null);
  const [newKey, setNewKey] = useState<ApiKeyCreateResponse | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    expiresAt: '',
  });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devkeys');
      if (!response.ok) throw new Error('Failed to fetch API keys');
      
      const data = await response.json();
      setKeys(data.keys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    try {
      const response = await fetch('/api/devkeys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          expiresAt: formData.expiresAt || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create API key');
      
      const data = await response.json();
      setNewKey(data);
      setShowNewKey(true);
      setCreateDialogOpen(false);
      setFormData({ name: '', expiresAt: '' });
      await fetchKeys();
      toast.success('API key created successfully');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const rotateKey = async () => {
    if (!selectedKey) return;

    try {
      const response = await fetch('/api/devkeys/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: selectedKey.id,
          name: selectedKey.name,
        }),
      });

      if (!response.ok) throw new Error('Failed to rotate API key');
      
      const data = await response.json();
      setNewKey(data);
      setShowNewKey(true);
      setRotateDialogOpen(false);
      setSelectedKey(null);
      await fetchKeys();
      toast.success('API key rotated successfully');
    } catch (error) {
      console.error('Error rotating API key:', error);
      toast.error('Failed to rotate API key');
    }
  };

  const revokeKey = async (keyId: string) => {
    try {
      const response = await fetch('/api/devkeys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });

      if (!response.ok) throw new Error('Failed to revoke API key');
      
      await fetchKeys();
      toast.success('API key revoked successfully');
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'revoked':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Revoked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: Date | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Developer Portal</h1>
        <p className="text-muted-foreground mt-2">
          Manage your API keys and access the Siraj API
        </p>
      </div>

      {/* API Documentation Link */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            API Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Learn how to integrate with the Siraj API using your API keys.
          </p>
          <Button asChild>
            <a href="/docs/api" target="_blank" rel="noopener noreferrer">
              View API Documentation
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Create and manage API keys for accessing the Siraj API
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for accessing the Siraj API. The key will only be shown once.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Key Name</Label>
                    <Input
                      id="name"
                      placeholder="My API Key"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createKey} disabled={!formData.name.trim()}>
                      Create Key
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading API keys...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {key.keyPrefix}{key.keyId.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(key.status)}
                      {isExpired(key.expiresAt) && (
                        <Badge variant="outline" className="ml-2">
                          <Clock className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(key.createdAt)}</TableCell>
                    <TableCell>{formatDate(key.lastUsedAt)}</TableCell>
                    <TableCell>{formatDate(key.expiresAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {key.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedKey(key);
                                setRotateDialogOpen(true);
                              }}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Rotate
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Revoke
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to revoke this API key? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => revokeKey(key.id)}>
                                    Revoke
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && keys.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No API keys found. Create your first API key to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Key Display Dialog */}
      <Dialog open={showNewKey} onOpenChange={setShowNewKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your API key has been created. Copy it now as it won't be shown again.
            </DialogDescription>
          </DialogHeader>
          {newKey && (
            <div className="space-y-4">
              <div>
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKey.key}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(newKey.key)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This is the only time you'll see this API key. 
                  Make sure to copy it and store it securely.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowNewKey(false)}>
                  I've Saved My Key
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rotate Key Dialog */}
      <Dialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate API Key</DialogTitle>
            <DialogDescription>
              Rotating this key will create a new key and revoke the old one. 
              Make sure to update your applications with the new key.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRotateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={rotateKey}>
              Rotate Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
