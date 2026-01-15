import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileX } from "lucide-react";

/**
 * Empty State Component
 * Displayed when there's no data to show
 */
function EmptyState({ 
  icon: Icon = FileX, 
  title = "No data found", 
  description = "There's nothing here yet.",
  actionLabel,
  onAction 
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}

export default EmptyState;
