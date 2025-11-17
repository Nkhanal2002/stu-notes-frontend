import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { marked } from "marked";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CreateNoteDialog({ isOpen, onClose, onSave, loading }) {
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
  });
  const saveInProgressRef = useRef(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }, []);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleSave = () => {
    if (saveInProgressRef.current || loading) {
      console.log(" Save already in progress, ignoring duplicate call");
      return;
    }

    saveInProgressRef.current = true;
    onSave(newNote);
    setNewNote({ title: "", content: "" });

    setTimeout(() => {
      saveInProgressRef.current = false;
    }, 1000);
  };

  const handleClose = () => {
    setNewNote({ title: "", content: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl sm:min-w-[72%]">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Add a new note to your collection
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto pr-2">
          <div>
            <Label htmlFor="title" className="mb-2">
              Title
            </Label>
            <Input
              id="title"
              value={newNote.title}
              onChange={(e) =>
                setNewNote((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter note title..."
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
                  value={newNote.content}
                  height="400px"
                  extensions={[markdown()]}
                  theme={isDark ? githubDark : githubLight}
                  onChange={(value) =>
                    setNewNote((prev) => ({ ...prev, content: value }))
                  }
                  placeholder="Write your note content with markdown support..."
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
                    __html: marked.parse(newNote.content || "*No content yet*"),
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading || saveInProgressRef.current}
          className="w-full text-white mt-4"
        >
          {loading ? "Creating..." : "Create Note"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
