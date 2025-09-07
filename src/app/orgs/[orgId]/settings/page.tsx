'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { Users, Mail, Settings, Crown, Shield, User } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  ownerUid: string;
  seats: number;
  createdAt: string;
}

interface OrgMember {
  uid: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  invitedAt: string;
  joinedAt?: string;
  invitedBy: string;
  email?: string;
  name?: string;
}

interface OrgInvite {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

export default function OrgSettingsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'MEMBER' as 'ADMIN' | 'MEMBER',
  });

  useEffect(() => {
    loadOrgData();
  }, [orgId]);

  const loadOrgData = async () => {
    try {
      const [orgResponse, membersResponse, invitesResponse] = await Promise.all([
        fetch(`/api/orgs/${orgId}`),
        fetch(`/api/orgs/${orgId}/members`),
        fetch(`/api/orgs/${orgId}/invites`),
      ]);

      if (orgResponse.ok) {
        const { org } = await orgResponse.json();
        setOrg(org);
      }

      if (membersResponse.ok) {
        const { members } = await membersResponse.json();
        setMembers(members);
      }

      if (invitesResponse.ok) {
        const { invites } = await invitesResponse.json();
        setInvites(invites);
      }
    } catch (error) {
      console.error('Error loading org data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      const response = await fetch(`/api/orgs/${orgId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      if (!response.ok) {
        throw new Error('Failed to send invite');
      }

      const { invite } = await response.json();
      setInvites([...invites, invite]);
      setInviteForm({ email: '', role: 'MEMBER' });
      
      // TODO: Show success message
      console.log(`Invite sent! Join link: /i/${invite.token}`);
    } catch (error) {
      console.error('Error sending invite:', error);
      // TODO: Show error message
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateSeats = async (newSeats: number) => {
    try {
      const response = await fetch(`/api/orgs/${orgId}/seats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seats: newSeats }),
      });

      if (!response.ok) {
        throw new Error('Failed to update seats');
      }

      if (org) {
        setOrg({ ...org, seats: newSeats });
      }
    } catch (error) {
      console.error('Error updating seats:', error);
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

  if (!org) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Organization not found</h1>
          <p className="text-gray-600 mt-2">The organization you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const roleIcons = {
    OWNER: <Crown className="h-4 w-4" />,
    ADMIN: <Shield className="h-4 w-4" />,
    MEMBER: <User className="h-4 w-4" />,
  };

  const roleColors = {
    OWNER: 'bg-yellow-100 text-yellow-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    MEMBER: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{org.name}</h1>
          <p className="text-gray-600">Organization Settings</p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organization Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Name</Label>
                <p className="font-medium">{org.name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Seats</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={org.seats}
                    onChange={(e) => handleUpdateSeats(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">of {members.length} used</span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Created</Label>
                <p className="text-sm">{new Date(org.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members and Invites */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invite New Member */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invite New Member
              </CardTitle>
              <CardDescription>
                Send an invitation to join your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value: 'ADMIN' | 'MEMBER') => setInviteForm({ ...inviteForm, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Members */}
          <Card>
            <CardHeader>
              <CardTitle>Current Members</CardTitle>
              <CardDescription>
                Manage your organization members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.uid}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {roleIcons[member.role]}
                          {member.name || 'Unknown User'}
                        </div>
                      </TableCell>
                      <TableCell>{member.email || 'No email'}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[member.role]}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.joinedAt 
                          ? new Date(member.joinedAt).toLocaleDateString()
                          : 'Pending'
                        }
                      </TableCell>
                      <TableCell>
                        {member.role !== 'OWNER' && (
                          <Button variant="outline" size="sm">
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pending Invites */}
          {invites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations that haven't been accepted yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>{invite.email}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[invite.role]}>
                            {invite.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invite.invitedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invite.status === 'pending' ? 'default' : 'secondary'}>
                            {invite.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
