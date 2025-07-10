import { Car } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2 p-2 font-bold text-lg text-primary">
      <Car className="h-6 w-6" />
      <span className="font-headline">RideShare Dash</span>
    </div>
  );
}
