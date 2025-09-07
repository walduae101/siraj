'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Shield, Search, Plus, Crown, Users } from 'lucide-react';

interface Entitlement {
  id: string;
  uid: string;
  plan: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  userEmail?: string;
  userName?: string;
}

export default function AdminEntitlementsPage() {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({
    email: '',
    plan: 'pro',
    duration: '30',
  });

  useEffect(() => {
    loadEntitlements();
  }, []);

  const loadEntitlements = async () => {
    try {
      const response = await fetch('/api/admin/entitlements');
      if (!response.ok) {
        throw new Error('Failed to load entitlements');
      }

      const { entitlements } = await response.json();
      setEntitlements(entitlements);
    } catch (error) {
      console.error('Error loading entitlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntitlements = entitlements.filter(entitlement => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      entitlement.uid.toLowerCase().includes(searchLower) ||
      entitlement.plan.toLowerCase().includes(searchLower) ||
      entitlement.status.toLowerCase().includes(searchLower) ||
      (entitlement.userEmail && entitlement.userEmail.toLowerCase().includes(searchLower)) ||
      (entitlement.userName && entitlement.userName.toLowerCase().includes(searchLower))
    );
  });

  const handleGrantEntitlement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/entitlements/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grantForm),
      });

      if (!response.ok) {
        throw new Error('Failed to grant entitlement');
      }

      // Reload entitlements
      await loadEntitlements();
      setGrantDialogOpen(false);
      setGrantForm({ email: '', plan: 'pro', duration: '30' });
      
      // TODO: Show success message
    } catch (error) {
      console.error('Error granting entitlement:', error);
      // TODO: Show error message
    }
  };

  const handleRevokeEntitlement = async (uid: string) => {
    if (!confirm('Are you sure you want to revoke this entitlement?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/entitlements/${uid}/revoke`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke entitlement');
      }

      // Reload entitlements
      await loadEntitlements();
      
      // TODO: Show success message
    } catch (error) {
      console.error('Error revoking entitlement:', error);
      // TODO: Show error message
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Crown className="h-4 w-4" />;
      case 'org': return <Users className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold">Entitlements</h1>
            <p className="text-gray-600">Manage user subscriptions and access</p>
          </div>
        </div>
        
        <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Grant Entitlement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Entitlement</DialogTitle>
              <DialogDescription>
                Manually grant a subscription to a user
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGrantEntitlement} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">User Email</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={grantForm.email}
                  onChange={(e) => setGrantForm({ ...grantForm, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan</label>
                <Select value={grantForm.plan} onValueChange={(value) => setGrantForm({ ...grantForm, plan: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="org">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (days)</label>
                <Input
                  type="number"
                  min="1"
                  value={grantForm.duration}
                  onChange={(e) => setGrantForm({ ...grantForm, duration: e.target.value })}
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setGrantDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Grant Entitlement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Entitlements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by email, user ID, or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Entitlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Entitlements</CardTitle>
          <CardDescription>
            Showing {filteredEntitlements.length} of {entitlements.length} entitlements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntitlements.map((entitlement) => (
                  <TableRow key={entitlement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {entitlement.userName || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entitlement.userEmail || entitlement.uid}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlanIcon(entitlement.plan)}
                        <span className="capitalize">{entitlement.plan}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entitlement.status)}>
                        {entitlement.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(entitlement.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {entitlement.expiresAt 
                        ? new Date(entitlement.expiresAt).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {entitlement.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeEntitlement(entitlement.uid)}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
