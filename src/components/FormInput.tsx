import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormInputProps extends InputProps {
  label: string;
  error?: string;
  defaultValue?: string;
}

export function FormInput({
  label,
  id,
  error,
  className,
  defaultValue,
  ...props
}: FormInputProps) {
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        defaultValue={defaultValue}
        className={`${className} ${
          error ? "border-destructive/50 dark:border-destructive" : ""
        }`}
        {...props}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm text-destructive [&>svg]:text-destructive"
        >
          {error}
        </p>
      )}
    </>
  );
}
