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

const pickupLocations: { value: PickupLocation; label: string }[] = [
    { value: 'airport_t1', label: 'Airport T1' },
    { value: 'airport_t2', label: 'Airport T2' },
    { value: 'airport_t3', label: 'Airport T3' },
    { value: 'dubai_mall', label: 'Dubai Mall' },
    { value: 'atlantis', label: 'Atlantis' },
    { value: 'global_village', label: 'Global Village' },
    { value: 'bolt_online_booking', label: 'Bolt Online Booking' },
    { value: 'otp_booking_airport', label: 'OTP Booking Airport' },
    { value: 'otp_booking_global_village', label: 'OTP Booking Global Village' },
    { value: 'other', label: 'Other' },
];

const incomeSchema = z.object({
  platform: z.enum(['uber', 'careem', 'bolt'], { required_error: "Please select a platform."}),
  pickupLocation: z.enum([
    "airport_t1",
    "airport_t2",
    "airport_t3",
    "dubai_mall",
    "atlantis",
    "global_village",
    "bolt_online_booking",
    "otp_booking_airport",
    "otp_booking_global_village",
    "other",
  ]).optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  distance: z.coerce.number().optional(),
  date: z.date(),
  salikToll: z.coerce.number().optional(),
  airportFee: z.coerce.number().optional(),
  bookingFee: z.coerce.number().optional(),
  commission: z.coerce.number().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export default function AddIncomeDialog() {
  const [open, setOpen] = useState(false);
  const { addIncome } = useAppContext();
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date(),
      commission: 0,
      bookingFee: 0,
      airportFee: 0,
    },
  });

  const platform = form.watch("platform");
  const amount = form.watch("amount");
  const pickupLocation = form.watch("pickupLocation");

  useEffect(() => {
    if (platform === 'bolt') {
      if (amount > 0) {
        const commission = amount * 0.2;
        form.setValue('commission', parseFloat(commission.toFixed(2)));
      } else {
        form.setValue('commission', 0);
      }
      form.setValue('airportFee', 20);
    } else {
        form.setValue('commission', 0);
        form.setValue('airportFee', 0);
        form.setValue('bookingFee', 0);
        form.setValue('pickupLocation', undefined);
    }
  }, [platform, amount, form]);

  useEffect(() => {
    if (platform === 'bolt' && pickupLocation) {
      let fee = 0;
      switch (pickupLocation) {
        case 'otp_booking_airport':
          fee = 25;
          break;
        case 'dubai_mall':
        case 'global_village':
        case 'otp_booking_global_village':
            fee = 16;
            break;
        case 'bolt_online_booking':
          fee = 50;
          break;
        default:
          fee = 0;
      }
      form.setValue('bookingFee', fee);
    } else if (platform !== 'bolt') {
      form.setValue('bookingFee', 0);
    }
  }, [platform, pickupLocation, form]);


  const onSubmit = (data: IncomeFormValues) => {
    addIncome({ ...data, date: data.date.toISOString() });
    form.reset({ date: new Date(), amount: undefined, distance: undefined, salikToll: undefined, airportFee: 0, bookingFee: 0, commission: 0 });
    setOpen(false);
  };

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
          
          {platform === 'bolt' && (
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
                      {pickupLocations.map(loc => (
                        <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          

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
          
          {platform === 'bolt' && (
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="bookingFee">Booking Fee</Label>
                    <Input id="bookingFee" type="number" step="0.01" placeholder="10.00" {...form.register('bookingFee')} readOnly />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="airportFee">Airport Fee</Label>
                    <Input id="airportFee" type="number" step="0.01" placeholder="20.00" {...form.register('airportFee')} readOnly />
                </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="commission">Commission</Label>
                <Input id="commission" type="number" step="0.01" placeholder="5.00" {...form.register('commission')} readOnly={platform === 'bolt'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salikToll">Salik Toll</Label>
              <Input id="salikToll" type="number" step="0.01" placeholder="4.00" {...form.register('salikToll')} />
            </div>
          </div>
          
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
