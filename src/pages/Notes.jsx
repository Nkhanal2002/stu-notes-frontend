import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EditDialog from "../components/EditDialog";
import CreateNoteDialog from "../components/CreateNoteDialog";
import Pagination from "../components/Pagination";
import NoteCard from "../components/NoteCard";
import ViewDialog from "../components/ViewDialog";

export default function Notes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const saveInProgressRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState({ title: "", content: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${backendURL}/api/transcribe/getNotes`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.notes) {
        const transformedNotes = data.notes.map((note) => ({
          id: note._id,
          title: note.title,
          content: note.content,
          date: new Date(note.createdAt).toISOString().split("T")[0],
          type: note.type || "manual",
          createdAt: note.createdAt,
        }));
        transformedNotes.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotes(transformedNotes);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotes = filteredNotes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleCreateNote = async (newNote) => {
    if (saveInProgressRef.current) {
      console.log("[v0] Save already in progress, skipping duplicate call");
      return;
    }

    if (!newNote.title || !newNote.content) {
      toast.error("Please provide both title and content");
      return;
    }

    saveInProgressRef.current = true;
    setLoading(true);
    try {
      const response = await fetch(`${backendURL}/api/transcribe/saveNotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newNote.title,
          content: newNote.content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Note created successfully!");
        setCreateDialogOpen(false);
        fetchNotes();
      } else {
        toast.error(data.message || "Failed to create note");
      }
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    } finally {
      setLoading(false);
      saveInProgressRef.current = false;
    }
  };

  const handleDeleteNote = async (noteId, noteTitle) => {
    setDeleteLoading(noteId);
    try {
      const response = await fetch(
        `${backendURL}/api/transcribe/deleteNote/${encodeURIComponent(
          noteTitle
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`"${noteTitle}" deleted successfully!`);
        fetchNotes();
      } else {
        toast.error(data.message || "Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleTakeQuiz = (note) => {
    navigate("/quizzes", {
      state: {
        quizContent: {
          title: note.title,
          content: note.content,
          type: "note",
        },
      },
    });
  };

  const handleViewNote = (note) => {
    setSelectedNote(note);
    setViewerOpen(true);
  };

  const handleEditNote = (note) => {
    setEditingNote({ title: note.title, content: note.content, id: note.id });
    setEditDialogOpen(true);
    setViewerOpen(false);
  };

  const handleSaveEdit = async (updatedNote, shouldSave = false) => {
    if (!shouldSave) {
      setEditingNote(updatedNote);
      return;
    }

    if (!updatedNote.title || !updatedNote.content) {
      toast.error("Please provide both title and content");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendURL}/api/transcribe/updateNote`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          noteId: updatedNote.id,
          title: updatedNote.title,
          content: updatedNote.content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Note updated successfully!");
        setEditingNote({ title: "", content: "" });
        setEditDialogOpen(false);
        fetchNotes();
      } else {
        toast.error(data.message || "Failed to update note");
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[80vh]">
      <div className="mb-8">
        <div className="flex-col sm:flex sm:flex-row justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              My Notes
            </h1>
            <p className="text-muted-foreground">
              Manage and view both transcribed and manual notes.
            </p>
          </div>

          <Button
            className="gap-2 text-white my-2 sm:my-0"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
        {paginatedNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onView={handleViewNote}
            onEdit={handleEditNote}
            onTakeQuiz={handleTakeQuiz}
            onDelete={handleDeleteNote}
            deleteLoading={deleteLoading}
          />
        ))}
      </div>

      {filteredNotes.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredNotes.length}
          itemName="notes"
        />
      )}

      <CreateNoteDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateNote}
        loading={loading}
      />

      <ViewDialog
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        item={selectedNote}
        onEdit={handleEditNote}
        onTakeQuiz={handleTakeQuiz}
        itemType="note"
        titleProperty="title"
        contentProperty="content"
        dateProperty="date"
        typeProperty="type"
      />

      <EditDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        item={editingNote}
        onSave={handleSaveEdit}
        loading={loading}
        itemType="note"
        titleProperty="title"
        contentProperty="content"
        idProperty="id"
      />

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No notes found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Create your first note to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
