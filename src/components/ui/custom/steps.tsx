import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
  } from "@/components/ui/breadcrumb";
  import { Fragment } from "react";
  
  interface Step {
    label: string;
    href?: string;
  }
  
  interface StepsProps {
    steps: Step[];
    current: number;
    onStepChange: (index: number) => void;
  }
  
  export default function Steps({ steps, current, onStepChange }: StepsProps) {
    return (
      <Breadcrumb>
        <BreadcrumbList className="
          flex gap-2 w-full 
          flex-col items-start 
          sm:flex-row sm:items-center
          "
        >
          {steps.map((step, index) => (
            <Fragment key={index}>
              <BreadcrumbItem>
                {current === index ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-full border-2 bg-primary text-white border-primary font-bold text-base transition"
                    >
                      {index + 1}
                    </span>
                    {step.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={step.href}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={e => {
                      e.preventDefault();
                      onStepChange(index);
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-full border-2 bg-muted text-muted-foreground border-muted font-bold text-base transition"
                    >
                      {index + 1}
                    </span>
                    {step.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index !== steps.length - 1 && (
                <li
                  className="hidden sm:inline-block h-[2px] w-[40px] bg-muted"
                  aria-hidden="true"
                />
              )}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }
  