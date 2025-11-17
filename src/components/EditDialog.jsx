import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { marked } from "marked";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EditDialog({
  isOpen,
  onClose,
  item,
  onSave,
  loading,
  itemType = "note", // "note" or "transcript"
  titleProperty = "title",
  contentProperty = "content",
  idProperty = "id",
}) {
  const [editingItem, setEditingItem] = useState({
    title: "",
    content: "",
    id: "",
  });
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (item) {
      setEditingItem({
        title: item[titleProperty] || "",
        content: item[contentProperty] || "",
        id: item[idProperty] || item._id || "",
      });
    }
  }, [item, titleProperty, contentProperty, idProperty]);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }, []);

  const handleSave = () => {
    if (itemType === "note") {
      // For notes, pass the updated item directly
      onSave(
        { ...item, title: editingItem.title, content: editingItem.content },
        true
      );
    } else {
      // For transcripts, pass the editing item
      onSave(editingItem, true);
    }
  };

  const handleClose = () => {
    setEditingItem({ title: "", content: "", id: "" });
    onClose();
  };

  const handleFieldChange = (field, value) => {
    if (itemType === "note") {
      // For notes, update the item directly through onSave
      onSave({ ...item, [field]: value });
    } else {
      // For transcripts, update local state
      setEditingItem((prev) => ({ ...prev, [field]: value }));
    }
  };

  const getCurrentValue = (field) => {
    if (itemType === "note") {
      return item?.[field] || "";
    }
    return editingItem[field] || "";
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl sm:min-w-[72%]">
        <DialogHeader>
          <DialogTitle>
            Edit {itemType === "note" ? "Note" : "Transcript"}
          </DialogTitle>
          <DialogDescription>Make changes to your {itemType}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto  pr-2">
          <div>
            <Label htmlFor="edit-title" className="mb-2">
              Title
            </Label>
            <Input
              id="edit-title"
              value={getCurrentValue("title")}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder={`Enter ${itemType} title...`}
            />
          </div>
          <div>
            <Label className="mb-2">Content</Label>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <CodeMirror
                  value={getCurrentValue("content")}
                  height="400px"
                  extensions={[markdown()]}
                  theme={isDark ? githubDark : githubLight}
                  onChange={(value) => handleFieldChange("content", value)}
                  placeholder={
                    itemType === "note"
                      ? "Write your note content with markdown support..."
                      : "Edit your transcript content..."
                  }
                  className="border rounded-md overflow-hidden"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div
                  className="border rounded-md p-4 h-[400px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none 
                    prose-headings:mt-8 prose-headings:mb-6 prose-headings:font-semibold
                    prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-6
                    prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-5
                    prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-4
                    prose-p:my-6 prose-p:leading-8
                    prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-3
                    prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-3
                    prose-li:my-3 prose-li:leading-7
                    prose-strong:font-semibold prose-em:italic
                    prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-hr:my-8"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(
                      getCurrentValue("content") || "*No content yet*"
                    ),
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className={itemType === "note" ? "flex gap-2 mt-4" : "mt-4"}>
          {itemType === "note" ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 text-white"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full text-white"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
