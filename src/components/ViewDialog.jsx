import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Play } from "lucide-react";
import { marked } from "marked";
import { useMemo } from "react";

export default function ViewDialog({
  isOpen,
  onClose,
  item,
  onEdit,
  onTakeQuiz,
  itemType = "note", // "note" or "transcript"
  titleProperty = "title",
  contentProperty = "content",
  dateProperty = "date",
  typeProperty = "type",
}) {
  // Configure marked options for better rendering
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
  });

  const contentHtml = useMemo(() => {
    if (!item) return "";
    const content = item[contentProperty] || "";
    return marked.parse(content);
  }, [item, contentProperty]);

  if (!item) return null;

  const getDisplayDate = () => {
    const dateValue = item[dateProperty];
    if (!dateValue) return "Unknown date";

    // If it's already a formatted date string (like from notes), use it directly
    if (
      typeof dateValue === "string" &&
      dateValue.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      return dateValue;
    }

    try {
      // Handle both string timestamps and Date objects
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleDateString();
    } catch (error) {
      return "Date error";
    }
  };

  const getBadgeText = () => {
    if (itemType === "transcript") {
      return "Transcribed";
    }
    return item[typeProperty] === "transcribed" ? "Transcribed" : "Manual";
  };

  const getBadgeVariant = () => {
    if (itemType === "transcript") {
      return "default";
    }
    return item[typeProperty] === "transcribed" ? "default" : "secondary";
  };

  const canEdit = itemType === "note" && item[typeProperty] !== "transcribed";
  const showEditButton = canEdit && onEdit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={
          itemType === "note"
            ? "min-w-[72%] max-w-none"
            : "min-w-[72%] max-w-4xl"
        }
      >
        <DialogHeader>
          {itemType === "note" ? (
            <>
              <DialogTitle className="text-2xl flex items-start">
                {item[titleProperty]}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4" />
                {getDisplayDate()}
                <Badge
                  variant={getBadgeVariant()}
                  className={`ml-2 ${
                    getBadgeVariant() === "default" ? "text-white" : ""
                  }`}
                >
                  {getBadgeText()}
                </Badge>
              </DialogDescription>
            </>
          ) : (
            <div>
              <div>
                <DialogTitle className="text-xl mb-2 text-left">
                  {item[titleProperty]}
                </DialogTitle>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {getDisplayDate()}
                  </div>
                  <Badge
                    variant={getBadgeVariant()}
                    className="text-xs text-white"
                  >
                    {getBadgeText()}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <div
          className={
            itemType === "note"
              ? "overflow-y-auto max-h-[70vh] pr-4"
              : "overflow-y-auto max-h-[50vh] pr-2"
          }
        >
          <div
            className="prose prose-sm max-w-none dark:prose-invert 
              prose-headings:mt-8 prose-headings:mb-6 prose-headings:font-semibold
              prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-6
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-5
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-4
              prose-p:my-6 prose-p:leading-8
              prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-3
              prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-3
              prose-li:my-3 prose-li:leading-7
              prose-strong:font-semibold prose-strong:text-foreground
              prose-em:italic
              prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-6
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-6
              prose-hr:my-8"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          {showEditButton && (
            <Button
              onClick={() => onEdit(item)}
              variant="outline"
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Note
            </Button>
          )}
          <Button
            onClick={() => onTakeQuiz(item)}
            className={`${
              showEditButton ? "flex-1" : "w-full"
            } bg-primary hover:bg-green-600 text-white`}
          >
            <Play className="h-4 w-4 mr-2" />
            Take Quiz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
