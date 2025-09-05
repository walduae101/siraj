'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Shield, Search, Filter, Download } from 'lucide-react';

interface AuditEntry {
  id: string;
  actorUid: string;
  orgId?: string;
  type: string;
  meta: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function AdminAuditPage() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    actorUid: '',
    orgId: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuditEntries();
  }, [filters]);

  const loadAuditEntries = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.actorUid) params.append('actorUid', filters.actorUid);
      if (filters.orgId) params.append('orgId', filters.orgId);

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load audit entries');
      }

      const { entries } = await response.json();
      setAuditEntries(entries);
    } catch (error) {
      console.error('Error loading audit entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = auditEntries.filter(entry => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.type.toLowerCase().includes(searchLower) ||
      entry.actorUid.toLowerCase().includes(searchLower) ||
      (entry.orgId && entry.orgId.toLowerCase().includes(searchLower)) ||
      JSON.stringify(entry.meta).toLowerCase().includes(searchLower)
    );
  });

  const getTypeColor = (type: string) => {
    if (type.includes('auth')) return 'bg-blue-100 text-blue-800';
    if (type.includes('purchase')) return 'bg-green-100 text-green-800';
    if (type.includes('org')) return 'bg-purple-100 text-purple-800';
    if (type.includes('usage')) return 'bg-yellow-100 text-yellow-800';
    if (type.includes('admin')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatMeta = (meta: Record<string, any>) => {
    if (Object.keys(meta).length === 0) return '-';
    return JSON.stringify(meta, null, 2);
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
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-gray-600">System activity and user actions</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search audit entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="org">Organizations</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="admin">Admin Actions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Filter by user ID"
                value={filters.actorUid}
                onChange={(e) => setFilters({ ...filters, actorUid: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Filter by org ID"
                value={filters.orgId}
                onChange={(e) => setFilters({ ...filters, orgId: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries</CardTitle>
          <CardDescription>
            Showing {filteredEntries.length} of {auditEntries.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(entry.type)}>
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {entry.actorUid}
                      </code>
                    </TableCell>
                    <TableCell>
                      {entry.orgId ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {entry.orgId}
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                          {formatMeta(entry.meta)}
                        </pre>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.ipAddress ? (
                        <code className="text-xs">{entry.ipAddress}</code>
                      ) : (
                        <span className="text-gray-400">-</span>
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
