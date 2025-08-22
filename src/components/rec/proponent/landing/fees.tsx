import { Check, MoveRight, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Pricing = () => (
  <div className="w-full py-20 lg:py-40 px-4 sm:px-6 lg:px-8">
    <div className="container mx-auto">
      <div className="flex text-center justify-center items-center gap-4 flex-col">
        <Badge>Pricing</Badge>
        <div className="flex gap-2 flex-col">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter max-w-xl text-center font-regular">
            Prices that make sense!
          </h2>
          <p className="text-base sm:text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center">
            Managing a small business today is already tough.
          </p>
        </div>
        <div className="grid pt-12 lg:pt-20 text-left grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full gap-6 lg:gap-8">
          <Card className="w-full rounded-md">
            <CardHeader>
              <CardTitle>
                <span className="flex flex-row gap-4 items-center font-normal text-lg sm:text-xl">
                  Startup
                </span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Our goal is to streamline SMB trade, making it easier and faster
                than ever for everyone and everywhere.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 lg:gap-8 justify-start">
                <p className="flex flex-row items-center gap-2 text-lg sm:text-xl">
                  <span className="text-3xl sm:text-4xl font-bold">$40</span>
                  <span className="text-sm text-muted-foreground">
                    / month
                  </span>
                </p>
                <div className="flex flex-col gap-4 justify-start">
                  <div className="flex flex-row gap-4">
                    <Check className="w-4 h-4 mt-2 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-medium">Fast and reliable</p>
                      <p className="text-muted-foreground text-sm">
                        We&apos;ve made it fast and reliable.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-4 h-4 mt-2 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-medium">Fast and reliable</p>
                      <p className="text-muted-foreground text-sm">
                        We&apos;ve made it fast and reliable.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-4 h-4 mt-2 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-medium">Fast and reliable</p>
                      <p className="text-muted-foreground text-sm">
                        We&apos;ve made it fast and reliable.
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="gap-4 w-full">
                  Sign up today <MoveRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="w-full shadow-2xl rounded-md border-2 border-primary/20">
            <CardHeader>
              <CardTitle>
                <span className="flex flex-row gap-4 items-center font-normal text-lg sm:text-xl">
                  Growth
                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                </span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Our goal is to streamline SMB trade, making it easier and faster
                than ever for everyone and everywhere.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 lg:gap-8 justify-start">
                <p className="flex flex-row items-center gap-2 text-lg sm:text-xl">
                  <span className="text-3xl sm:text-4xl font-bold">$40</span>
                  <span className="text-sm text-muted-foreground">
                    / month
                  </span>
                </p>
                <div className="flex flex-col gap-4 justify-start">
                  <div className="flex flex-row gap-4">
                    <Check className="w-4 h-4 mt-2 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-medium">Fast and reliable</p>
                      <p className="text-muted-foreground text-sm">
                        We&apos;ve made it fast and reliable.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-4 h-4 mt-2 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-medium">Fast and reliable</p>
                      <p className="text-muted-foreground text-sm">
                        We&apos;ve made it fast and reliable.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-4 h-4 mt-2 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-medium">Fast and reliable</p>
                      <p className="text-muted-foreground text-sm">
                        We&apos;ve made it fast and reliable.
                      </p>
                    </div>
                  </div>
                </div>
                <Button className="gap-4 w-full">
                  Sign up today <MoveRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="w-full rounded-md md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>
                <span className="flex flex-row gap-4 items-center font-normal text-lg sm:text-xl">
                  Enterprise
                </span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Our goal is to streamline SMB trade, making it easier and faster
                than ever for everyone and everywhere.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 lg:gap-8 justify-start">
                <p className="flex flex-row items-center gap-2 text-lg sm:text-xl">
                  <span className="text-3xl sm:text-4xl font-bold">$40</span>
                  <span className="text-sm text-muted-foreground">
                    / month
                  </span>
                </p>
                <div className="flex flex-col gap-4 justify-start">
                  <div className="flex flex-row gap-4">
                    <Check className="w-4 h-4 mt-2 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-medium">Fast and reliable</p>
                      <p className="text-muted-foreground text-sm">
                        We&apos;ve made it fast and reliable.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-4 h-4 mt-2 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-medium">Fast and reliable</p>
                      <p className="text-muted-foreground text-sm">
                        We&apos;ve made it fast and reliable.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Check className="w-4 h-4 mt-2 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-medium">Fast and reliable</p>
                      <p className="text-muted-foreground text-sm">
                        We&apos;ve made it fast and reliable.
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="gap-4 w-full">
                  Book a meeting <PhoneCall className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);