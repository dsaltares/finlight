'use client';

import { Check, Pencil, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RouterOutput } from '@/lib/trpc';

type Goal = RouterOutput['savingsGoals']['list'][number];

type Props = {
  goal: Goal;
  onUpdate: (id: number) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
};

export default function GoalRowActions({
  goal,
  onUpdate,
  onDelete,
  onComplete,
  onUncomplete,
}: Props) {
  const isCompleted = !!goal.completedAt;

  return (
    <div className="flex items-center justify-end gap-1">
      {isCompleted ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUncomplete(goal.id)}
          aria-label={`Mark ${goal.name} as incomplete`}
        >
          <Undo2 className="size-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onComplete(goal.id)}
          aria-label={`Mark ${goal.name} as complete`}
        >
          <Check className="size-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onUpdate(goal.id)}
        aria-label={`Edit goal ${goal.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(goal.id)}
        aria-label={`Delete goal ${goal.name}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
