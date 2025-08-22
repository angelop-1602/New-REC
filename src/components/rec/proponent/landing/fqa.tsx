import { Check, PhoneCall, ChevronDown, MoveRight  } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


export const FAQ = () => (

  
  <div className="w-full py-20 lg:py-40 px-4 sm:px-6 lg:px-8">
    <div className="container mx-auto">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
        <div className="flex gap-8 lg:gap-10 flex-col">
          <div className="flex gap-4 flex-col">
            <div className="flex gap-2 flex-col">
              <h4 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter max-w-xl text-left font-regular">
                This is the start of something new
              </h4>
              <p className="text-base sm:text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
                Managing a small business today is already tough. Avoid further
                complications by ditching outdated, tedious trade methods. Our
                goal is to streamline SMB trade, making it easier and faster
                than ever.
              </p>
            </div>
            <div className="">
              <Dialog>
                <DialogTrigger className="gap-4 w-full sm:w-auto flex flex-row items-center justify-center">
                  <Badge className="gap-4 w-full sm:w-auto text-base" variant="outline">
                    <PhoneCall className="w-4 h-4" /> Any questions? Reach out <MoveRight className="w-4 h-4" />
                  </Badge>
                </DialogTrigger>
                <DialogContent >
                  <DialogHeader>
                    <DialogTitle>Fell free to message us</DialogTitle>
                    <DialogDescription className="mt-4 flex flex-col gap-6">
                      <div className="flex flex-col gap-6">
                        <div className="flex gap-4">
                          <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="firstname">First Name</Label>
                            <Input
                              type="text"
                              id="firstname"
                              placeholder="First Name"
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="lastname">Last Name</Label>
                            <Input
                              type="text"
                              id="lastname"
                              placeholder="Last Name"
                            />
                          </div>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="email">Email</Label>
                          <Input type="email" id="email" placeholder="Email" />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            type="text"
                            id="subject"
                            placeholder="Subject"
                          />
                        </div>
                        <div className="grid w-full gap-1.5">
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            placeholder="Type your message here."
                            id="message"
                          />
                        </div>
                        <Button className="w-full">Send Message</Button>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {Array.from({ length: 8 }).map((_, index) => (
            <AccordionItem key={index} value={"index-" + index}>
              <AccordionTrigger className="text-left text-sm sm:text-base">
                This is the start of something new <ChevronDown className="w-4 h-4" />
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                Managing a small business today is already tough. Avoid further
                complications by ditching outdated, tedious trade methods. Our
                goal is to streamline SMB trade, making it easier and faster
                than ever.
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </div>
);
