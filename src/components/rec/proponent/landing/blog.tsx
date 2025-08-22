import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Blog = () => (
  <div className="w-full py-20 lg:py-40 px-4 sm:px-6 lg:px-8">
    <div className="container mx-auto flex flex-col gap-12 lg:gap-14">
      <div className="flex w-full flex-col sm:flex-row sm:justify-between sm:items-center gap-6 lg:gap-8">
        <h4 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter max-w-xl font-regular">
          Latest articles
        </h4>
        <Button className="gap-4 w-full sm:w-auto">
          View all articles <MoveRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        <div className="flex flex-col gap-2 hover:opacity-75 cursor-pointer transition-opacity">
          <div className="bg-muted rounded-md aspect-video mb-4"></div>
          <h3 className="text-lg sm:text-xl tracking-tight font-medium">Pay supplier invoices</h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            Our goal is to streamline SMB trade, making it easier and faster
            than ever.
          </p>
        </div>
        <div className="flex flex-col gap-2 hover:opacity-75 cursor-pointer transition-opacity">
          <div className="bg-muted rounded-md aspect-video mb-4"></div>
          <h3 className="text-lg sm:text-xl tracking-tight font-medium">Pay supplier invoices</h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            Our goal is to streamline SMB trade, making it easier and faster
            than ever.
          </p>
        </div>
        <div className="flex flex-col gap-2 hover:opacity-75 cursor-pointer transition-opacity">
          <div className="bg-muted rounded-md aspect-video mb-4"></div>
          <h3 className="text-lg sm:text-xl tracking-tight font-medium">Pay supplier invoices</h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            Our goal is to streamline SMB trade, making it easier and faster
            than ever.
          </p>
        </div>
        <div className="flex flex-col gap-2 hover:opacity-75 cursor-pointer transition-opacity">
          <div className="bg-muted rounded-md aspect-video mb-4"></div>
          <h3 className="text-lg sm:text-xl tracking-tight font-medium">Pay supplier invoices</h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            Our goal is to streamline SMB trade, making it easier and faster
            than ever.
          </p>
        </div>
      </div>
    </div>
  </div>
);