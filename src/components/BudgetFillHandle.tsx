import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BudgetFillHandleProps {
  rowIndex: number;
  month: string;
  onFill: (startRow: number, startMonth: string, endRow: number, endMonth: string) => void;
  disabled?: boolean;
}

export const BudgetFillHandle = ({ rowIndex, month, onFill, disabled }: BudgetFillHandleProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragEnd, setDragEnd] = useState<{ row: number; month: string } | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Encontrar la celda más cercana al mouse
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const cellElement = elements.find(el => el.classList.contains('budget-cell'));
      
      if (cellElement) {
        const row = parseInt(cellElement.getAttribute('data-row') || '0');
        const cellMonth = cellElement.getAttribute('data-month') || '';
        setDragEnd({ row, month: cellMonth });
      }
    };

    const handleMouseUp = () => {
      if (dragEnd) {
        onFill(rowIndex, month, dragEnd.row, dragEnd.month);
      }
      setIsDragging(false);
      setDragEnd(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragEnd, rowIndex, month, onFill]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  if (disabled) return null;

  return (
    <>
      <div
        ref={handleRef}
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute bottom-0 right-0 w-2 h-2 bg-primary rounded-sm cursor-crosshair z-10",
          "hover:w-3 hover:h-3 transition-all",
          isDragging && "w-3 h-3 bg-primary/80"
        )}
        title="Arrastrar para rellenar"
      />
      
      {/* Overlay visual durante el arrastre */}
      {isDragging && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-primary/5" />
        </div>
      )}
    </>
  );
};
