'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { toast } from 'sonner';
import type { ChecklistItem } from '~/server/onboarding/service';

interface OnboardingClientProps {
  itemKey: ChecklistItem;
}

export function OnboardingClient({ itemKey }: OnboardingClientProps) {
  const [loading, setLoading] = useState(false);

  const handleMarkDone = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/onboarding/mark?item=${itemKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark item as done');
      }

      const result = await response.json();
      
      if (result.ok) {
        toast.success('Item marked as complete!');
        
        // Reload the page to show updated state
        window.location.reload();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error marking item as done:', error);
      toast.error('Failed to mark item as complete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleMarkDone}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? 'Marking...' : 'Mark Done'}
    </Button>
  );
}
