
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
import { PlusCircle, Calendar as CalendarIcon, Pencil } from 'lucide-react';
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
import type { Income, PickupLocation, RidePlatform, PaymentMethod } from '@/lib/types';
import { Separator } from './ui/separator';

const incomeSchema = z.object({
  platform: z.string({ required_error: "Please select a platform."}),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  distance: z.coerce.number().optional(),
  date: z.date(),
  pickupLocation: z.string().optional(),
  paymentMethod: z.string().optional(),
  salikFee: z.coerce.number().optional(),
  airportFee: z.coerce.number().optional(),
  bookingFee: z.coerce.number().optional(),
  commission: z.coerce.number().optional(),
  fuelCost: z.coerce.number().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

const defaultPlatforms: RidePlatform[] = ['bolt', 'uber', 'careem', 'dtc'];
const defaultPickupLocations: PickupLocation[] = ["airport_t1", "airport_t2", "airport_t3", "dubai_mall", "atlantis_the_palm", "global_village", "other"];
const paymentMethods: PaymentMethod[] = ["cash", "credit_card", "online_paid"];

export default function AddIncomeDialog({ income }: { income?: Income }) {
  const [open, setOpen] = useState(false);
  const { addIncome, updateIncome, settings } = useAppContext();
  const [isBookingFeeManual, setIsBookingFeeManual] = useState(true);

  const isEditing = !!income;
  
  const allPlatforms = [ ...defaultPlatforms, ...settings.customPlatforms];
  const allPickupLocations = [...defaultPickupLocations, ...settings.customPickupLocations];

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: isEditing ? {
        ...income,
        date: new Date(income.date),
    } : {
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
    if (isEditing && income) {
      form.reset({
        ...income,
        date: new Date(income.date),
      });
    }
  }, [isEditing, income, form, open]);


  useEffect(() => {
    if (platform === 'bolt') {
        const isAirport = pickupLocation === 'airport_t1' || pickupLocation === 'airport_t2' || pickupLocation === 'airport_t3';
        const isSpecialLocation = pickupLocation === 'dubai_mall' || pickupLocation === 'global_village' || pickupLocation === 'atlantis_the_palm';

        if (isAirport) {
            form.setValue('bookingFee', 25);
            setIsBookingFeeManual(false);
        } else if (isSpecialLocation) {
            form.setValue('bookingFee', 16);
            setIsBookingFeeManual(false);
        } else {
             if (pickupLocation) { // only reset if a location is selected
                form.setValue('bookingFee', 0);
            }
            setIsBookingFeeManual(true);
        }
        form.setValue('airportFee', 0);

    } else { // Logic for non-Bolt platforms
        const isAirport = pickupLocation === 'airport_t1' || pickupLocation === 'airport_t2' || pickupLocation === 'airport_t3';
        if (isAirport) {
            form.setValue('airportFee', 20);
        } else {
            if (pickupLocation) {
                form.setValue('airportFee', 0);
            }
        }
        setIsBookingFeeManual(true);
    }
  }, [platform, pickupLocation, form]);


  useEffect(() => {
    if (platform === 'bolt' && settings.boltCommission > 0) {
      const commission = amount * (settings.boltCommission / 100);
      form.setValue('commission', parseFloat(commission.toFixed(2)));
    } else {
      form.setValue('commission', 0);
      if (platform !== 'bolt') {
        form.setValue('bookingFee', 0);
      }
    }
  }, [platform, amount, settings.boltCommission, form]);


  useEffect(() => {
    if (distance > 0 && settings.fuelCostPerKm > 0) {
      const fuelCost = distance * settings.fuelCostPerKm;
      form.setValue('fuelCost', parseFloat(fuelCost.toFixed(2)));
    } else {
      form.setValue('fuelCost', 0);
    }
  }, [distance, settings.fuelCostPerKm, form]);


  const onSubmit = (data: IncomeFormValues) => {
    const submissionData = {
        ...data,
        date: data.date.toISOString(),
        pickupLocation: data.pickupLocation || null,
        paymentMethod: data.paymentMethod || null,
    };
    if (isEditing && income) {
        updateIncome(income.id, submissionData);
    } else {
        addIncome(submissionData);
    }
    
    if (!isEditing) {
        form.reset({ date: new Date(), amount: 0, distance: 0, platform: undefined, salikFee: 0, airportFee: 0, bookingFee: 0, commission: 0, fuelCost: 0, pickupLocation: undefined, paymentMethod: undefined });
    }
    setOpen(false);
  };

  const isAirportSelected = pickupLocation === 'airport_t1' || pickupLocation === 'airport_t2' || pickupLocation === 'airport_t3';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
            <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
            </Button>
        ) : (
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Income
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Income' : 'Add New Income'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this ride.' : 'Record a new ride-sharing income entry.'}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-6 -mr-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Controller
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultPlatforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p.toUpperCase()}</SelectItem>)}
                        {settings.customPlatforms.length > 0 && <Separator />}
                        {settings.customPlatforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.platform && <p className="text-sm font-medium text-destructive">{form.formState.errors.platform.message}</p>}
              </div>

               <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Controller
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(p => <SelectItem key={p} value={p} className="capitalize">{p.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          
            {platform === 'bolt' && (
              <div className="space-y-2">
                  <Label htmlFor="pickupLocation">Pickup Location</Label>
                  <Controller
                      control={form.control}
                      name="pickupLocation"
                      render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                          <SelectContent>
                              {defaultPickupLocations.map(l => <SelectItem key={l} value={l} className="capitalize">{l.replace(/_/g, ' ')}</SelectItem>)}
                              {settings.customPickupLocations.length > 0 && <Separator />}
                              {settings.customPickupLocations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      )}
                  />
              </div>
            )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Gross Amount (AED)</Label>
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
          
          {platform === 'bolt' ? (
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="bookingFee">Booking Fee</Label>
                    <Input id="bookingFee" type="number" step="0.01" placeholder="10.00" {...form.register('bookingFee')} readOnly={!isBookingFeeManual} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="commission">Bolt Commission Fee</Label>
                    <Input id="commission" type="number" step="0.01" placeholder="5.00" {...form.register('commission')} readOnly/>
                </div>
            </div>
          ): (
            isAirportSelected && (
              <div className="space-y-2">
                  <Label htmlFor="airportFee">Airport Fee</Label>
                  <Input id="airportFee" type="number" step="0.01" placeholder="20.00" {...form.register('airportFee')} readOnly />
              </div>
          )
          )}


          <div className="grid grid-cols-1 gap-4">
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
            <Input value={`AED ${netIncome.toFixed(2)}`} readOnly className="font-bold text-lg h-12 bg-muted" />
          </div>
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit">{isEditing ? 'Save Changes' : 'Add Income'}</Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
