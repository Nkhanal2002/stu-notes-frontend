import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Play, X } from "lucide-react";
import { marked } from "marked";
import { useMemo } from "react";

export default function ViewDialog({
  isOpen,
  onClose,
  item,
  onEdit,
  onTakeQuiz,
  itemType = "note",
  titleProperty = "title",
  contentProperty = "content",
  dateProperty = "date",
  typeProperty = "type",
}) {
  marked.setOptions({
    breaks: true,
    gfm: true,
    pedantic: false,
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

    if (
      typeof dateValue === "string" &&
      dateValue.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      return dateValue;
    }

    try {
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
            ? "w-[90%] max-h-[72vh] sm:max-h-[80vh] sm:min-w-[72%] sm:max-w-none flex flex-col"
            : "w-[90%] max-h-[72vh] sm:max-h-[80vh] sm:min-w-[72%] sm:max-w-4xl flex flex-col"
        }
      >
        <DialogHeader className="flex-shrink-0">
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
              ? "overflow-y-auto flex-1 pr-4 min-h-0"
              : "overflow-y-auto flex-1 pr-2 min-h-0"
          }
        >
          <div
            className="prose prose-base max-w-none dark:prose-invert 
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-5 prose-h1:leading-tight
              prose-h2:text-3xl prose-h2:mt-7 prose-h2:mb-4 prose-h2:leading-snug
              prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:leading-snug
              prose-h4:text-xl prose-h4:mt-5 prose-h4:mb-3
              prose-p:my-4 prose-p:leading-7 prose-p:text-base
              prose-ul:my-5 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
              prose-ol:my-5 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
              prose-li:my-1.5 prose-li:leading-7 prose-li:pl-1
              prose-li:marker:text-primary prose-li:marker:font-bold
              prose-strong:font-bold prose-strong:text-foreground
              prose-em:italic prose-em:text-foreground
              prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
              prose-pre:bg-muted prose-pre:p-5 prose-pre:rounded-lg prose-pre:my-6 prose-pre:overflow-x-auto
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:my-6 prose-blockquote:py-2
              prose-hr:my-8 prose-hr:border-border
              prose-a:text-primary prose-a:underline prose-a:font-medium
              [&_p+p]:mt-4
              [&_h1+p]:mt-4
              [&_h2+p]:mt-3
              [&_h3+p]:mt-3
              [&_ul+p]:mt-5
              [&_ol+p]:mt-5
              [&_p+ul]:mt-4
              [&_p+ol]:mt-4
              [&_ul]:block
              [&_ol]:block
              [&_li]:block"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>

        <div className="flex gap-2 pt-4 border-t flex-shrink-0 mt-auto">
          {showEditButton ? (
            <>
              <div className="flex gap-2 flex-1 sm:flex-initial">
                <Button
                  onClick={() => onEdit(item)}
                  variant="outline"
                  className="flex-1 sm:flex-initial sm:min-w-[120px]"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Note
                </Button>
                <Button
                  onClick={() => onTakeQuiz(item)}
                  className="flex-1 sm:flex-initial sm:min-w-[120px] bg-primary hover:bg-green-600 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Take Quiz
                </Button>
              </div>
              <Button
                onClick={onClose}
                variant="outline"
                className="hidden sm:flex sm:ml-auto sm:min-w-[100px]"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => onTakeQuiz(item)}
                className="flex-1 bg-primary hover:bg-green-600 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Take Quiz
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
