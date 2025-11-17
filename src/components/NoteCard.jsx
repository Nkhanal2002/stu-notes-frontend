import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, MoreVertical, Eye, Edit, FileText } from "lucide-react";
import DeleteDialog from "./DeleteDialog";
import { marked } from "marked";
import { useMemo } from "react";

export default function NoteCard({
  note,
  onView,
  onEdit,
  onTakeQuiz,
  onDelete,
  deleteLoading,
}) {
  const previewText = useMemo(() => {
    if (!note?.content) return "";

    // Parse markdown to HTML
    const html = marked.parse(note.content, { breaks: true, gfm: true });

    // Strip HTML tags to get plain text for preview
    const text = html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }, [note?.content]);

  return (
    <Card
      className="h-[200px] bg-card border-border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(note)}
    >
      <CardContent className="p-3 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <FileText className="text-primary mr-1" />
          <h3 className=" text-base font-bold  line-clamp-1 flex-1 mr-2">
            {note.title}
          </h3>
          <div
            className="flex items-center gap-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {note.date}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(note)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(note)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTakeQuiz(note)}>
                  <Play className="h-4 w-4 mr-2" />
                  Take Quiz
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 mt-4 mb-4">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {previewText}
          </p>
        </div>

        <div
          className="flex gap-1.5 mt-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-transparent text-xs sm:text-sm"
            onClick={() => onView(note)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Open
          </Button>

          <Button
            size="sm"
            className="bg-primary text-white flex-1 text-xs sm:text-sm "
            onClick={() => onTakeQuiz(note)}
          >
            <Play className="h-3 w-3 mr-1" />
            Take Quiz
          </Button>
          <DeleteDialog
            item={note}
            onDelete={onDelete}
            loading={deleteLoading === note.id}
            itemType="Note"
            titleProperty="title"
            idProperty="id"
          />
        </div>
      </CardContent>
    </Card>
  );
}
