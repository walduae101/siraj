"use client";

import {
  CheckCircle,
  Clock,
  CreditCard,
  Globe,
  Monitor,
  Plus,
  Shield,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export default function FraudListsPage() {
  const [selectedList, setSelectedList] = useState<"denylist" | "allowlist">(
    "denylist",
  );
  const [selectedType, setSelectedType] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "ip" as const,
    value: "",
    reason: "",
    notes: "",
    expiresAt: "",
  });

  // Fetch lists
  const { data: denylist, refetch: refetchDenylist } =
    api.fraud.admin.lists.list.useQuery(
      { list: "denylist" },
      { refetchInterval: 30000 },
    );

  const { data: allowlist, refetch: refetchAllowlist } =
    api.fraud.admin.lists.list.useQuery(
      { list: "allowlist" },
      { refetchInterval: 30000 },
    );

  // Mutations
  const addToDenylist = api.fraud.admin.lists.addToDenylist.useMutation({
    onSuccess: () => {
      toast.success("Added to denylist");
      refetchDenylist();
      setIsAddDialogOpen(false);
      setNewEntry({
        type: "ip",
        value: "",
        reason: "",
        notes: "",
        expiresAt: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to add to denylist: ${error.message}`);
    },
  });

  const addToAllowlist = api.fraud.admin.lists.addToAllowlist.useMutation({
    onSuccess: () => {
      toast.success("Added to allowlist");
      refetchAllowlist();
      setIsAddDialogOpen(false);
      setNewEntry({
        type: "ip",
        value: "",
        reason: "",
        notes: "",
        expiresAt: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to add to allowlist: ${error.message}`);
    },
  });

  const removeFromDenylist =
    api.fraud.admin.lists.removeFromDenylist.useMutation({
      onSuccess: () => {
        toast.success("Removed from denylist");
        refetchDenylist();
      },
      onError: (error) => {
        toast.error(`Failed to remove from denylist: ${error.message}`);
      },
    });

  const removeFromAllowlist =
    api.fraud.admin.lists.removeFromAllowlist.useMutation({
      onSuccess: () => {
        toast.success("Removed from allowlist");
        refetchAllowlist();
      },
      onError: (error) => {
        toast.error(`Failed to remove from allowlist: ${error.message}`);
      },
    });

  const cleanupExpired = api.fraud.admin.lists.cleanupExpired.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Cleaned up ${result.denylist + result.allowlist} expired entries`,
      );
      refetchDenylist();
      refetchAllowlist();
    },
    onError: (error) => {
      toast.error(`Failed to cleanup expired entries: ${error.message}`);
    },
  });

  const handleAddEntry = () => {
    if (!newEntry.value || !newEntry.reason) {
      toast.error("Value and reason are required");
      return;
    }

    const entry = {
      type: newEntry.type,
      value: newEntry.value,
      reason: newEntry.reason,
      notes: newEntry.notes || undefined,
      expiresAt: newEntry.expiresAt ? new Date(newEntry.expiresAt) : undefined,
    };

    if (selectedList === "denylist") {
      addToDenylist.mutate(entry);
    } else {
      addToAllowlist.mutate(entry);
    }
  };

  const handleRemoveEntry = (type: string, value: string) => {
    if (selectedList === "denylist") {
      removeFromDenylist.mutate({ type: type as any, value });
    } else {
      removeFromAllowlist.mutate({ type: type as any, value });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ip":
        return <Globe className="h-4 w-4" />;
      case "uid":
        return <User className="h-4 w-4" />;
      case "emailDomain":
        return <Globe className="h-4 w-4" />;
      case "device":
        return <Monitor className="h-4 w-4" />;
      case "bin":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ip":
        return "IP Address";
      case "uid":
        return "User ID";
      case "emailDomain":
        return "Email Domain";
      case "device":
        return "Device";
      case "bin":
        return "Card BIN";
      default:
        return type;
    }
  };

  const currentList = selectedList === "denylist" ? denylist : allowlist;
  const filteredList = selectedType
    ? currentList?.filter((entry) => entry.type === selectedType)
    : currentList;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Fraud Lists Management</h1>
          <p className="text-muted-foreground">
            Manage allow and deny lists for fraud prevention
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => cleanupExpired.mutate()}>
            Cleanup Expired
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Add to{" "}
                  {selectedList === "denylist" ? "Denylist" : "Allowlist"}
                </DialogTitle>
                <DialogDescription>
                  Add a new entry to the{" "}
                  {selectedList === "denylist" ? "deny" : "allow"} list
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newEntry.type}
                    onValueChange={(value) =>
                      setNewEntry({ ...newEntry, type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ip">IP Address</SelectItem>
                      <SelectItem value="uid">User ID</SelectItem>
                      <SelectItem value="emailDomain">Email Domain</SelectItem>
                      <SelectItem value="device">Device</SelectItem>
                      <SelectItem value="bin">Card BIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    value={newEntry.value}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, value: e.target.value })
                    }
                    placeholder={
                      newEntry.type === "ip" ? "192.168.1.1" : "Enter value"
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Input
                    id="reason"
                    value={newEntry.reason}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, reason: e.target.value })
                    }
                    placeholder="Reason for adding to list"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newEntry.notes}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, notes: e.target.value })
                    }
                    placeholder="Additional notes (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={newEntry.expiresAt}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, expiresAt: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddEntry}
                    disabled={
                      addToDenylist.isPending || addToAllowlist.isPending
                    }
                  >
                    Add Entry
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs
        value={selectedList}
        onValueChange={(value: string) =>
          setSelectedList(value as "denylist" | "allowlist")
        }
      >
        <TabsList>
          <TabsTrigger value="denylist" className="flex items-center space-x-2">
            <XCircle className="h-4 w-4" />
            <span>Denylist ({denylist?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger
            value="allowlist"
            className="flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Allowlist ({allowlist?.length || 0})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedList} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {selectedList === "denylist" ? "Denylist" : "Allowlist"}{" "}
                  Entries
                </span>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="ip">IP Address</SelectItem>
                    <SelectItem value="uid">User ID</SelectItem>
                    <SelectItem value="emailDomain">Email Domain</SelectItem>
                    <SelectItem value="device">Device</SelectItem>
                    <SelectItem value="bin">Card BIN</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
              <CardDescription>
                {selectedList === "denylist"
                  ? "Entries that will be automatically denied"
                  : "Entries that will be automatically allowed"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredList && filteredList.length > 0 ? (
                <div className="space-y-4">
                  {filteredList.map((entry) => (
                    <div
                      key={`${entry.type}-${entry.value}`}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center space-x-4">
                        {getTypeIcon(entry.type)}
                        <div>
                          <div className="font-medium">{entry.value}</div>
                          <div className="text-muted-foreground text-sm">
                            {getTypeLabel(entry.type)} • {entry.reason}
                          </div>
                          {entry.notes && (
                            <div className="text-muted-foreground text-sm">
                              {entry.notes}
                            </div>
                          )}
                          <div className="mt-1 flex items-center space-x-2">
                            <Badge variant="outline">{entry.type}</Badge>
                            <span className="text-muted-foreground text-xs">
                              Added by {entry.addedBy.substring(0, 8)}... on{" "}
                              {entry.addedAt.toLocaleDateString()}
                            </span>
                            {entry.expiresAt && (
                              <span className="text-muted-foreground text-xs">
                                • Expires {entry.expiresAt.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRemoveEntry(entry.type, entry.value)
                        }
                        disabled={
                          removeFromDenylist.isPending ||
                          removeFromAllowlist.isPending
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No {selectedList === "denylist" ? "denylist" : "allowlist"}{" "}
                  entries found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
