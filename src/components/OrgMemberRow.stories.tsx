import type { Meta, StoryObj } from '@storybook/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Crown, Shield, User } from 'lucide-react';

const meta: Meta = {
  title: 'Components/OrgMemberRow',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

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

export const OwnerMember: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
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
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-2">
                {roleIcons.OWNER}
                John Doe
              </div>
            </TableCell>
            <TableCell>john@company.com</TableCell>
            <TableCell>
              <Badge className={roleColors.OWNER}>
                OWNER
              </Badge>
            </TableCell>
            <TableCell>Jan 15, 2024</TableCell>
            <TableCell>
              <span className="text-gray-400 text-sm">Cannot remove owner</span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const AdminMember: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
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
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-2">
                {roleIcons.ADMIN}
                Jane Smith
              </div>
            </TableCell>
            <TableCell>jane@company.com</TableCell>
            <TableCell>
              <Badge className={roleColors.ADMIN}>
                ADMIN
              </Badge>
            </TableCell>
            <TableCell>Jan 20, 2024</TableCell>
            <TableCell>
              <Button variant="outline" size="sm">
                Remove
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const RegularMember: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
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
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-2">
                {roleIcons.MEMBER}
                Bob Johnson
              </div>
            </TableCell>
            <TableCell>bob@company.com</TableCell>
            <TableCell>
              <Badge className={roleColors.MEMBER}>
                MEMBER
              </Badge>
            </TableCell>
            <TableCell>Feb 1, 2024</TableCell>
            <TableCell>
              <Button variant="outline" size="sm">
                Remove
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const AllRoles: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
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
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-2">
                {roleIcons.OWNER}
                John Doe
              </div>
            </TableCell>
            <TableCell>john@company.com</TableCell>
            <TableCell>
              <Badge className={roleColors.OWNER}>
                OWNER
              </Badge>
            </TableCell>
            <TableCell>Jan 15, 2024</TableCell>
            <TableCell>
              <span className="text-gray-400 text-sm">Cannot remove owner</span>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-2">
                {roleIcons.ADMIN}
                Jane Smith
              </div>
            </TableCell>
            <TableCell>jane@company.com</TableCell>
            <TableCell>
              <Badge className={roleColors.ADMIN}>
                ADMIN
              </Badge>
            </TableCell>
            <TableCell>Jan 20, 2024</TableCell>
            <TableCell>
              <Button variant="outline" size="sm">
                Remove
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-2">
                {roleIcons.MEMBER}
                Bob Johnson
              </div>
            </TableCell>
            <TableCell>bob@company.com</TableCell>
            <TableCell>
              <Badge className={roleColors.MEMBER}>
                MEMBER
              </Badge>
            </TableCell>
            <TableCell>Feb 1, 2024</TableCell>
            <TableCell>
              <Button variant="outline" size="sm">
                Remove
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};
