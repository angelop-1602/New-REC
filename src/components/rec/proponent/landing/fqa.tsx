"use client"

import { useState } from "react";
import { PhoneCall, MoveRight, Send } from "lucide-react";
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
import { toast } from "sonner";
import Link from "next/link";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const FAQ = () => {
  const { ref: faqRef, isVisible: faqVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true });
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({
      firstname: "",
      lastname: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  const faqs = [
    {
      question: "Who needs to submit their research for ethics review?",
      answer: (
        <>
          All research studies involving human participants, their data, or biological materials must undergo ethics review. This includes research conducted by SPUP faculty, staff, or students, as well as externally sponsored research implemented within SPUP or its partner institutions. Only the REC can confirm if a study qualifies for exemption from review.{" "}
          <Link href="/rec/proponent/process" className="text-primary hover:underline font-semibold">
            Learn more about the review process
          </Link>
          .
        </>
      ),
    },
    {
      question: "How do I submit my research protocol?",
      answer: (
        <>
          Submit your complete protocol package through the SPUP REC online application system. The process includes: (1) Protocol Information - complete the online application form, (2) Protocol Documents - upload all necessary documents, and (3) Review & Confirm - review all submitted information before final submission. You&apos;ll receive a temporary protocol code (PENDING-YYYYMMDD-XXXXXX) for tracking.{" "}
          <Link href="/rec/proponent/application" className="text-primary hover:underline font-semibold">
            Start your submission here
          </Link>
          {" "}or{" "}
          <Link href="/rec/proponent/process#submission" className="text-primary hover:underline font-semibold">
            view detailed submission steps
          </Link>
          .
        </>
      ),
    },
    {
      question: "What documents do I need to submit?",
      answer: (
        <>
          Your submission must include: Form 07C (Informed Consent Form), Form 07B (Adviser&apos;s Certification Form for students), Full Study Protocol, Abstract, Data Gathering Tools, Curriculum Vitae of all researchers, Minutes of Proposal Defense (if applicable), and Official Receipt/Proof of Payment for Ethics Review.{" "}
          <Link href="/rec/proponent/process#submission" className="text-primary hover:underline font-semibold">
            View complete list and download forms
          </Link>
          .
        </>
      ),
    },
    {
      question: "How long does the review process take?",
      answer: (
        <>
          The review timeline varies: Initial screening takes 1-2 days, administrative screening and SPUP code assignment takes 1 day, and the ethics review process takes approximately 3-6 weeks depending on review type and complexity. Expedited reviews typically take 3-4 weeks, while full board reviews may take 4-6 weeks depending on meeting schedules.{" "}
          <Link href="/rec/proponent/process" className="text-primary hover:underline font-semibold">
            See detailed timelines for each step
          </Link>
          .
        </>
      ),
    },
    {
      question: "What are the different types of review?",
      answer: (
        <>
          There are five review types: SR (Standard Review) for Social/Behavioral Research, PR (Public Health Research), HO (Health Operations), BS (Biomedical Research), and EX (Exempted from Review). SR, PR, HO, and BS require 3 reviewers, while EX requires 2 reviewers. The review type is determined by the REC Chair based on your protocol&apos;s characteristics.{" "}
          <Link href="/rec/proponent/process#review-types" className="text-primary hover:underline font-semibold">
            Learn more about review types
          </Link>
          .
        </>
      ),
    },
    {
      question: "What happens if my protocol requires revisions?",
      answer: (
        <>
          If revisions are required, you&apos;ll receive detailed comments from reviewers and the REC Chair. Use{" "}
          <Link href="/forms/Form%2008A%20Protocol%20Resubmission%20Form.docx" className="text-primary hover:underline font-semibold">
            Form 08A (Protocol Resubmission Form)
          </Link>
          {" "}to resubmit. Bold and underline all changes, indicate page and line numbers, and use updated version numbers. Submit revised documents through the online system within the specified timeline (typically 15 days with a 15-day grace period if needed).{" "}
          <Link href="/rec/proponent/process#resubmissions" className="text-primary hover:underline font-semibold">
            View resubmission guidelines
          </Link>
          .
        </>
      ),
    },
    {
      question: "How do I make payment for ethics review?",
      answer: (
        <>
          For online payments, use LBP Account No. 0121-3376-90, BDO Account No. 00274-000435-0 (for GCash transfers), or BPI Account No. 8693-0892-13. Indicate your name/student number, course, and &apos;REC Payment&apos; as reference. Send deposit slip (validated) and transfer confirmation to{" "}
          <Link href="mailto:ggacias@spup.edu.ph" className="text-primary hover:underline font-semibold">
            ggacias@spup.edu.ph
          </Link>
          {" "}to receive your Official Receipt. Include the Official Receipt in your protocol package.{" "}
          <Link href="/rec/proponent/process#submission" className="text-primary hover:underline font-semibold">
            See payment instructions
          </Link>
          .
        </>
      ),
    },
    {
      question: "What are my responsibilities after approval?",
      answer: (
        <>
          After approval, you must: conduct the study strictly according to the approved protocol, seek REC approval for any amendments before implementation, submit progress reports as required, promptly report adverse events or protocol deviations, notify the REC of early termination, and submit a final report within 8 weeks after study completion. Use the appropriate forms (Form 09B, 10, 11, 12, 13, 14A){" "}
          <Link href="/rec/proponent/process#after-approval" className="text-primary hover:underline font-semibold">
            available on the Process page
          </Link>
          .
        </>
      ),
    },
  ];

  return (
    <div id="faq" className="w-full py-8 lg:py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div 
          ref={faqRef}
          className={`grid lg:grid-cols-2 gap-6 lg:gap-8 transition-all duration-1000 ${
            faqVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex gap-4 lg:gap-6 flex-col">
            <div className="flex gap-4 flex-col">
              <div className={`flex gap-2 flex-col transition-all duration-700 delay-100 ${
                faqVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter max-w-xl text-left font-regular text-foreground">
                  Frequently Asked Questions
                </h2>
                <p className="text-base sm:text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
                  Find answers to common questions about the SPUP Research Ethics Committee review process. If you have additional questions, feel free to reach out to us.
                </p>
              </div>
              <div className={`transition-all duration-700 delay-200 ${
                faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <Dialog>
                  <DialogTrigger asChild>
                    <Badge className="gap-2 w-full sm:w-auto text-base cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 border-primary" variant="outline">
                      <PhoneCall className="w-4 h-4" /> Any questions? Reach out <MoveRight className="w-4 h-4" />
                    </Badge>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact SPUP REC</DialogTitle>
                      <DialogDescription className="mt-4">
                        Send us a message and we&apos;ll get back to you as soon as possible.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-6">
                      <div className="flex gap-4">
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="firstname">First Name</Label>
                          <Input
                            type="text"
                            id="firstname"
                            placeholder="First Name"
                            value={formData.firstname}
                            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="lastname">Last Name</Label>
                          <Input
                            type="text"
                            id="lastname"
                            placeholder="Last Name"
                            value={formData.lastname}
                            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          type="email"
                          id="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          type="text"
                          id="subject"
                          placeholder="Subject of your inquiry"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          placeholder="Type your message here..."
                          id="message"
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </form>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Or contact us directly at{" "}
                        <Link href="mailto:rec@spup.edu.ph" className="text-primary hover:underline font-semibold">
                          rec@spup.edu.ph
                        </Link>
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          <div className={`transition-all duration-700 delay-300 ${
            faqVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="transition-all duration-300 hover:bg-muted/50 rounded-lg px-2"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-medium text-foreground hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {typeof faq.answer === 'string' ? faq.answer : faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};
