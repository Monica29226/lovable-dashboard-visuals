import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, AlertCircle, Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BudgetCellInputProps {
  value: number;
  onChange: (value: number) => void;
  isEdited?: boolean;
  className?: string;
  disabled?: boolean;
}

export const BudgetCellInput = ({ 
  value, 
  onChange, 
  isEdited = false,
  className,
  disabled = false
}: BudgetCellInputProps) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const formatNumber = (val: number): string => {
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const validateAndUpdate = (val: string) => {
    // Remover comas y espacios
    const cleanValue = val.replace(/,/g, '').trim();
    
    // Validar que sea un número
    const numValue = parseFloat(cleanValue);
    
    if (cleanValue === '' || cleanValue === '-') {
      setIsValid(true);
      return;
    }
    
    if (isNaN(numValue)) {
      setIsValid(false);
      return;
    }
    
    setIsValid(true);
    onChange(numValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (isValid && inputValue) {
      const numValue = parseFloat(inputValue.replace(/,/g, ''));
      if (!isNaN(numValue)) {
        setInputValue(formatNumber(numValue));
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Mostrar valor sin formato para facilitar edición
    const numValue = parseFloat(inputValue.replace(/,/g, ''));
    if (!isNaN(numValue)) {
      setInputValue(numValue.toString());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    validateAndUpdate(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir navegación con teclas de dirección
    if (e.key === 'Enter' || e.key === 'Tab') {
      handleBlur();
    }
  };

  return (
    <TooltipProvider>
      <div className="relative group">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "text-right font-mono transition-all",
            !isValid && "border-destructive focus:border-destructive ring-destructive",
            isEdited && !isFocused && "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800",
            isFocused && "ring-2 ring-primary bg-primary/5",
            disabled && "cursor-not-allowed opacity-60 bg-muted/50",
            !disabled && "hover:border-primary/50 hover:bg-accent/30 cursor-text",
            className
          )}
        />
        
        {/* Indicador de campo editable al hover */}
        {!disabled && !isFocused && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
        
        {/* Indicador de celda editada */}
        {isEdited && !isFocused && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Celda modificada</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Indicador de validación */}
        {isFocused && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            {isValid ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Debe ser un valor numérico</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
