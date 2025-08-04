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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/contexts/app-provider';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { PickupLocation } from '@/lib/types';

const incomeSchema = z.object({
  platform: z.enum(['uber', 'careem', 'bolt'], { required_error: "Please select a platform."}),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  distance: z.coerce.number().optional(),
  date: z.date(),
  pickupLocation: z.enum(["airport_t1", "airport_t2", "airport_t3", "dubai_mall", "atlantis_the_palm", "global_village", "other"]).optional(),
  salikFee: z.coerce.number().optional(),
  airportFee: z.coerce.number().optional(),
  bookingFee: z.coerce.number().optional(),
  commission: z.coerce.number().optional(),
  fuelCost: z.coerce.number().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export default function AddIncomeDialog() {
  const [open, setOpen] = useState(false);
  const { addIncome } = useAppContext();
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      distance: 0,
      commission: 0,
      bookingFee: 0,
      airportFee: 0,
      fuelCost: 0,
      salikFee: 0,
    },
  });

  const platform = form.watch("platform");
  const distance = form.watch("distance") || 0;
  const pickupLocation = form.watch("pickupLocation");
  const amount = form.watch("amount") || 0;
  
  const watchedValues = form.watch();
  const netIncome = (watchedValues.amount || 0) - (watchedValues.salikFee || 0) - (watchedValues.airportFee || 0) - (watchedValues.bookingFee || 0) - (watchedValues.commission || 0) - (watchedValues.fuelCost || 0);

  useEffect(() => {
    const isAirport = pickupLocation === 'airport_t1' || pickupLocation === 'airport_t2' || pickupLocation === 'airport_t3';
    if (isAirport) {
        form.setValue('airportFee', 20);
    } else {
      form.setValue('airportFee', 0);
    }

    if (platform === 'bolt') {
      const commission = amount * 0.20;
      form.setValue('commission', parseFloat(commission.toFixed(2)));
    } else {
      // Reset fields when platform is not Bolt
      form.setValue('commission', 0);
      form.setValue('bookingFee', 0);
    }
  }, [platform, pickupLocation, amount, form]);


  useEffect(() => {
    if (distance > 0) {
      const fuelCost = distance * 0.29;
      form.setValue('fuelCost', parseFloat(fuelCost.toFixed(2)));
    } else {
      form.setValue('fuelCost', 0);
    }
  }, [distance, form]);


  const onSubmit = (data: IncomeFormValues) => {
    addIncome({ ...data, date: data.date.toISOString() });
    form.reset({ date: new Date(), amount: 0, distance: 0, platform: undefined, salikFee: 0, airportFee: 0, bookingFee: 0, commission: 0, fuelCost: 0, pickupLocation: undefined });
    setOpen(false);
  };

  const isAirportSelected = pickupLocation === 'airport_t1' || pickupLocation === 'airport_t2' || pickupLocation === 'airport_t3';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Income
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Income</DialogTitle>
          <DialogDescription>
            Record a new ride-sharing income entry.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Controller
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uber">Uber</SelectItem>
                      <SelectItem value="careem">Careem</SelectItem>
                      <SelectItem value="bolt">Bolt</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.platform && <p className="text-sm font-medium text-destructive">{form.formState.errors.platform.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="pickupLocation">Pickup Location</Label>
                <Controller
                    control={form.control}
                    name="pickupLocation"
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="airport_t1">Airport T1</SelectItem>
                            <SelectItem value="airport_t2">Airport T2</SelectItem>
                            <SelectItem value="airport_t3">Airport T3</SelectItem>
                            <SelectItem value="dubai_mall">Dubai Mall</SelectItem>
                            <SelectItem value="atlantis_the_palm">Atlantis The Palm</SelectItem>
                            <SelectItem value="global_village">Global Village</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
            </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Gross Amount ($)</Label>
              <Input id="amount" type="number" step="0.01" placeholder="25.50" {...form.register('amount')} />
              {form.formState.errors.amount && <p className="text-sm font-medium text-destructive">{form.formState.errors.amount.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="distance">Distance (KM)</Label>
              <Input id="distance" type="number" step="0.1" placeholder="15.2" {...form.register('distance')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="fuelCost">Fuel Cost</Label>
                <Input id="fuelCost" type="number" step="0.01" placeholder="4.41" {...form.register('fuelCost')} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salikFee">Salik Fee</Label>
              <Input id="salikFee" type="number" step="0.01" placeholder="4.00" {...form.register('salikFee')} />
            </div>
          </div>
          
          {platform === 'bolt' && (
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="bookingFee">Booking Fee</Label>
                    <Input id="bookingFee" type="number" step="0.01" placeholder="10.00" {...form.register('bookingFee')} />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="commission">Bolt Commission Fee</Label>
                    <Input id="commission" type="number" step="0.01" placeholder="5.00" {...form.register('commission')} readOnly/>
                </div>
            </div>
          )}

          {isAirportSelected && (
             <div className="space-y-2">
                <Label htmlFor="airportFee">Airport Fee</Label>
                <Input id="airportFee" type="number" step="0.01" placeholder="20.00" {...form.register('airportFee')} readOnly />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Controller
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {form.formState.errors.date && <p className="text-sm font-medium text-destructive">{form.formState.errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Net Income</Label>
            <Input value={`$${netIncome.toFixed(2)}`} readOnly className="font-bold text-lg h-12 bg-muted" />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add Income</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
