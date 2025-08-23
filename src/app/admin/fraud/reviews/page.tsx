"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { CheckCircle, XCircle, Clock, Eye, AlertTriangle, User, CreditCard, Globe } from "lucide-react";
import { toast } from "sonner";

export default function FraudReviewsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");

  // Fetch reviews
  const { data: reviews, refetch: refetchReviews } = api.fraud.admin.reviews.list.useQuery(
    { status: selectedStatus as any, limit: 50 },
    { refetchInterval: 30000 }
  );

  // Resolve review mutation
  const resolveReview = api.fraud.admin.reviews.resolve.useMutation({
    onSuccess: () => {
      toast.success("Review resolved successfully");
      refetchReviews();
      setIsReviewDialogOpen(false);
      setSelectedReview(null);
      setResolveNotes("");
    },
    onError: (error) => {
      toast.error(`Failed to resolve review: ${error.message}`);
    },
  });

  const handleResolveReview = (action: "approve" | "deny") => {
    if (!selectedReview || !resolveNotes.trim()) {
      toast.error("Please provide notes for the resolution");
      return;
    }

    resolveReview.mutate({
      id: selectedReview.id,
      action,
      notes: resolveNotes,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "denied": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "denied": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "allow": return "bg-green-100 text-green-800";
      case "challenge": return "bg-yellow-100 text-yellow-800";
      case "deny": return "bg-red-100 text-red-800";
      case "queue_review": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredReviews = reviews || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manual Reviews</h1>
          <p className="text-muted-foreground">
            Review and resolve flagged transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                Transactions that require manual review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredReviews.filter((r: any) => r.status === "open").length > 0 ? (
                <div className="space-y-4">
                  {filteredReviews
                    .filter((review: any) => review.status === "open")
                    .map((review: any) => (
                      <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{review.uid.substring(0, 8)}...</span>
                              <Badge className={getActionColor(review.decision?.action)}>
                                {review.decision?.action?.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Score: {review.decision?.score} | Confidence: {review.decision?.confidence}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Product: {review.checkout?.productId} | Qty: {review.checkout?.quantity} | 
                              Price: ${review.checkout?.price}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created: {new Date(review.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              setIsReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending reviews found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Reviews</CardTitle>
              <CardDescription>
                Previously reviewed transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredReviews.filter((r: any) => r.status !== "open").length > 0 ? (
                <div className="space-y-4">
                  {filteredReviews
                    .filter((review: any) => review.status !== "open")
                    .map((review: any) => (
                      <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{review.uid.substring(0, 8)}...</span>
                              <Badge className={getStatusColor(review.status)}>
                                {getStatusIcon(review.status)}
                                <span className="ml-1">{review.status}</span>
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Original Action: {review.decision?.action?.replace("_", " ")} | 
                              Score: {review.decision?.score}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Product: {review.checkout?.productId} | Qty: {review.checkout?.quantity}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Resolved: {review.resolvedAt ? new Date(review.resolvedAt).toLocaleString() : "Unknown"}
                            </div>
                            {review.adminNotes && (
                              <div className="text-xs text-muted-foreground">
                                Notes: {review.adminNotes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No resolved reviews found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Transaction</DialogTitle>
            <DialogDescription>
              Review the flagged transaction and decide whether to approve or deny
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              {/* Review Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User ID</Label>
                  <div className="text-sm font-mono">{selectedReview.uid}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedReview.status)}>
                    {selectedReview.status}
                  </Badge>
                </div>
                <div>
                  <Label>Risk Score</Label>
                  <div className="text-sm">{selectedReview.decision?.score}</div>
                </div>
                <div>
                  <Label>Confidence</Label>
                  <div className="text-sm">{selectedReview.decision?.confidence}%</div>
                </div>
                <div>
                  <Label>Product</Label>
                  <div className="text-sm">{selectedReview.checkout?.productId}</div>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <div className="text-sm">{selectedReview.checkout?.quantity}</div>
                </div>
                <div>
                  <Label>Price</Label>
                  <div className="text-sm">${selectedReview.checkout?.price}</div>
                </div>
                <div>
                  <Label>Created</Label>
                  <div className="text-sm">{new Date(selectedReview.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Risk Reasons */}
              <div>
                <Label>Risk Reasons</Label>
                <div className="mt-2 space-y-1">
                  {selectedReview.decision?.reasons?.map((reason: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution Notes */}
              <div>
                <Label htmlFor="notes">Resolution Notes *</Label>
                <Textarea
                  id="notes"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Provide notes explaining your decision..."
                  className="mt-2"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleResolveReview("deny")}
                  disabled={resolveReview.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deny
                </Button>
                <Button
                  onClick={() => handleResolveReview("approve")}
                  disabled={resolveReview.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
