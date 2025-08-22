import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "../textarea";

interface CustomInputProps {
  label: string;
  errorMessage: string;
  type: string;
  placeholder: string;
  className?: string;
  rows?: number;
}

export default function CustomInput({ label, errorMessage, type, placeholder, className, rows = 3 }: CustomInputProps) {
  return (
    <div className="w-full max-w-xs space-y-1.5">
      <Label htmlFor="label" className="text-destructive">
        {label}
      </Label>
      {type === "textarea" ? (
        <Textarea
          id="label"
          placeholder={placeholder}
          className={cn("border-destructive focus-visible:ring-destructive", className)}
          rows={rows}
        />
      ) : (
        <Input
          id="label"
          type={type}
          placeholder={placeholder}
          className={cn("border-destructive focus-visible:ring-destructive", className)}
        />
      )}
      <p className="text-[0.8rem] text-destructive">{errorMessage}</p>
    </div>
  );
}
