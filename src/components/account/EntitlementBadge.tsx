import { Crown, Star, Zap } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface EntitlementBadgeProps {
  type: 'SUBSCRIPTION' | 'POINTS';
  plan?: string;
  status?: 'active' | 'canceled' | 'past_due';
  className?: string;
}

export function EntitlementBadge({ type, plan, status, className }: EntitlementBadgeProps) {
  const getBadgeVariant = () => {
    if (type === 'SUBSCRIPTION') {
      switch (status) {
        case 'active':
          return 'default';
        case 'canceled':
          return 'destructive';
        case 'past_due':
          return 'secondary';
        default:
          return 'outline';
      }
    } else {
      return 'outline';
    }
  };

  const getIcon = () => {
    if (type === 'SUBSCRIPTION') {
      if (plan?.includes('org')) {
        return <Crown className="w-3 h-3 mr-1" />;
      } else if (plan?.includes('pro')) {
        return <Star className="w-3 h-3 mr-1" />;
      } else {
        return <Zap className="w-3 h-3 mr-1" />;
      }
    } else {
      return <Zap className="w-3 h-3 mr-1" />;
    }
  };

  const getText = () => {
    if (type === 'SUBSCRIPTION') {
      if (plan?.includes('org')) {
        return 'Organization';
      } else if (plan?.includes('pro')) {
        return 'Pro';
      } else {
        return 'Free';
      }
    } else {
      return 'Points';
    }
  };

  return (
    <Badge 
      variant={getBadgeVariant()}
      className={cn("inline-flex items-center", className)}
    >
      {getIcon()}
      {getText()}
    </Badge>
  );
}
