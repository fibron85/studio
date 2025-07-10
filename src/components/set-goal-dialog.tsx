'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Target } from 'lucide-react';
import { useAppContext } from '@/contexts/app-provider';

const goalSchema = z.object({
  monthly: z.coerce.number().min(1, 'Goal must be at least 1'),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export default function SetGoalDialog() {
  const [open, setOpen] = useState(false);
  const { goal, setGoal } = useAppContext();
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      monthly: goal.monthly,
    },
  });

  useEffect(() => {
    if(open) {
      form.reset({ monthly: goal.monthly });
    }
  }, [goal, open, form]);

  const onSubmit = (data: GoalFormValues) => {
    setGoal(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Target className="mr-2 h-4 w-4" /> Set Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Your Income Goal</DialogTitle>
          <DialogDescription>
            Define your monthly income target to track your progress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="monthly">Monthly Goal ($)</Label>
            <Input id="monthly" type="number" step="100" placeholder="2000" {...form.register('monthly')} />
            {form.formState.errors.monthly && <p className="text-sm font-medium text-destructive">{form.formState.errors.monthly.message}</p>}
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Goal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
