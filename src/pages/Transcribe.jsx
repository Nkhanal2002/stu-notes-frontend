import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mic, Square, Play, Pause, Save, Trash2, MicOff } from "lucide-react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TranscriptCard from "../components/TranscriptCard";
import EditDialog from "../components/EditDialog";
import Pagination from "../components/Pagination";
import ViewDialog from "../components/ViewDialog";

export default function Transcribe() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [title, setTitle] = useState("");
  const [savedTranscripts, setSavedTranscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState({
    title: "",
    content: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const intervalRef = useRef();
  const { user } = useAuth();
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (user) {
      fetchSavedTranscripts();
    }
  }, [user]);

  const fetchSavedTranscripts = async () => {
    try {
      const response = await fetch(
        `${backendURL}/api/transcribe/getTranscribedNotes`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.notes) {
        const sortedTranscripts = data.notes.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setSavedTranscripts(sortedTranscripts);
      }
    } catch (error) {
      console.error("Error fetching transcripts:", error);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    resetTranscript();

    SpeechRecognition.startListening({ continuous: true, language: "en-US" });

    intervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const pauseRecording = () => {
    setIsPaused(true);
    SpeechRecognition.stopListening();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeRecording = () => {
    setIsPaused(false);
    SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    intervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    SpeechRecognition.stopListening();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const saveTranscript = async () => {
    if (!transcript.trim()) {
      toast.error("No transcript to save");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for your transcript");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${backendURL}/api/transcribe/saveTranscribeNotes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: title.trim(),
            content: transcript,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Transcript saved successfully!");
        resetTranscript();
        setRecordingTime(0);
        setTitle("");
        fetchSavedTranscripts(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to save transcript");
      }
    } catch (error) {
      console.error("Error saving transcript:", error);
      toast.error("Failed to save transcript");
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async (transcriptTitle) => {
    setQuizLoading(transcriptTitle);
    try {
      const response = await fetch(`${backendURL}/api/transcribe/getQuiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title: transcriptTitle }),
      });

      const data = await response.json();

      if (data.quiz) {
        toast.success("Quiz generated successfully!");
        try {
          let quizData;
          if (Array.isArray(data.quiz)) {
            quizData = data.quiz;
          } else if (typeof data.quiz === "string") {
            // Clean markdown code blocks if present
            let cleanQuizData = data.quiz.trim();
            cleanQuizData = cleanQuizData
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/, "")
              .replace(/\s*```$/g, "")
              .trim();
            quizData = JSON.parse(cleanQuizData);
          } else {
            throw new Error("Unexpected quiz data format");
          }

          const formattedQuiz = {
            title: `Quiz: ${transcriptTitle}`,
            questions: quizData.map((q, index) => {
              // Extract options from either array or individual properties
              let options = [];
              if (q.options && Array.isArray(q.options)) {
                options = q.options;
              } else if (q.option1 && q.option2) {
                options = [q.option1, q.option2, q.option3, q.option4].filter(
                  Boolean
                );
              }

              // Determine correct answer index
              let correct = 0;
              if (typeof q.correct === "number") {
                correct = q.correct;
              } else if (typeof q.correctOption === "number") {
                correct = q.correctOption - 1;
              } else if (typeof q.answer === "string") {
                // Find the index of the answer in options
                const answerIndex = options.findIndex(
                  (opt) => opt === q.answer
                );
                correct = answerIndex !== -1 ? answerIndex : 0;
              }

              return {
                id: index + 1,
                type: "multiple-choice",
                question: q.question,
                options: options,
                correct: correct,
              };
            }),
          };
          navigate("/quizzes", { state: { generatedQuiz: formattedQuiz } });
        } catch (parseError) {
          console.error("Error parsing quiz data:", parseError);
          toast.error("Failed to parse quiz data");
        }
      } else {
        toast.error(data.message || "Failed to generate quiz");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz");
    } finally {
      setQuizLoading(null);
    }
  };

  const handleDeleteTranscript = async (transcriptId, transcriptTitle) => {
    setDeleteLoading(transcriptId);
    try {
      const response = await fetch(
        `${backendURL}/api/transcribe/deleteNote/${encodeURIComponent(
          transcriptTitle
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`"${transcriptTitle}" deleted successfully!`);
        fetchSavedTranscripts(); // Refresh the transcripts list
      } else {
        toast.error(data.message || "Failed to delete transcript");
      }
    } catch (error) {
      console.error("Error deleting transcript:", error);
      toast.error("Failed to delete transcript");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleViewTranscript = (transcript) => {
    setSelectedTranscript(transcript);
    setViewerOpen(true);
  };

  const handleEditTranscript = (transcript) => {
    setEditingTranscript({
      title: transcript.title,
      content: transcript.content,
      id: transcript._id,
    });
    setEditDialogOpen(true);
    setViewerOpen(false);
  };

  const handleSaveEdit = async (updatedTranscript, shouldSave = false) => {
    if (!shouldSave) {
      setEditingTranscript(updatedTranscript);
      return;
    }

    if (!updatedTranscript.title || !updatedTranscript.content) {
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
          noteId: updatedTranscript.id,
          title: updatedTranscript.title,
          content: updatedTranscript.content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Transcript updated successfully!");
        setEditingTranscript({ title: "", content: "" });
        setEditDialogOpen(false);
        fetchSavedTranscripts();
      } else {
        toast.error(data.message || "Failed to update transcript");
      }
    } catch (error) {
      console.error("Error updating transcript:", error);
      toast.error("Failed to update transcript");
    } finally {
      setLoading(false);
    }
  };

  const handleTakeQuiz = (transcript) => {
    navigate("/quizzes", {
      state: {
        quizContent: {
          title: transcript.title,
          content: transcript.content,
          type: "transcript",
        },
      },
    });
  };

  const totalPages = Math.ceil(savedTranscripts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTranscripts = savedTranscripts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const clearAll = () => {
    resetTranscript();
    setRecordingTime(0);
    setTitle("");
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MicOff className="h-5 w-5" />
              Speech Recognition Not Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your browser doesn't support speech recognition. Please use
              Chrome, Edge, or Safari for the best experience.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Mic className="h-8 w-8 text-primary" />
          Audio Transcription
        </h1>
        <p className="text-muted-foreground">
          Record and transcribe your lectures in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recording Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Live Recording
            </CardTitle>
            <CardDescription>
              Start recording to begin real-time transcription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recording Controls */}
            <div className="text-center space-y-4">
              <div className="text-4xl font-mono font-bold">
                {formatTime(recordingTime)}
              </div>

              <div className="flex justify-center gap-4">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="gap-2 text-white cursor-pointer"
                  >
                    <Mic className="h-5 w-5" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    {!isPaused ? (
                      <Button
                        onClick={pauseRecording}
                        variant="outline"
                        size="lg"
                        className="gap-2 bg-transparent cursor-pointer"
                      >
                        <Pause className="h-5 w-5" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        onClick={resumeRecording}
                        size="lg"
                        className="gap-2 cursor-pointer text-white"
                      >
                        <Play className="h-5 w-5" />
                        Resume
                      </Button>
                    )}
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      size="lg"
                      className="gap-2 cursor-pointer"
                    >
                      <Square className="h-5 w-5" />
                      Stop
                    </Button>
                  </>
                )}
              </div>

              {isRecording && (
                <Badge
                  variant={
                    isPaused
                      ? "secondary"
                      : listening
                      ? "default"
                      : "destructive"
                  }
                >
                  {isPaused
                    ? "Paused"
                    : listening
                    ? "Listening..."
                    : "Not Listening"}
                </Badge>
              )}
            </div>

            {/* Live Transcript */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Live Transcript</label>
              <Textarea
                value={transcript}
                readOnly
                placeholder="Transcription will appear here as you speak..."
                className="h-[200px] resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your transcript..."
                  className="w-full"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={saveTranscript}
                  className="gap-2 text-white"
                  disabled={loading || !transcript.trim()}
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Transcript"}
                </Button>
                <Button
                  onClick={clearAll}
                  variant="outline"
                  className="gap-2 bg-transparent"
                  disabled={!transcript && !title && recordingTime === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
                {recordingTime > 0 && (
                  <Button
                    onClick={() => setRecordingTime(0)}
                    variant="outline"
                    className="gap-2 bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Timer
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transcribed Notes</CardTitle>
            <CardDescription>
              Your previously recorded lectures as transcribed and clean notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedTranscripts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No saved transcribed notes yet. Start recording to create your
                first transcript!
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 auto-rows-max">
                  {paginatedTranscripts.map((transcript) => (
                    <TranscriptCard
                      key={transcript._id}
                      transcript={transcript}
                      onView={handleViewTranscript}
                      onTakeQuiz={handleTakeQuiz}
                      onDelete={handleDeleteTranscript}
                      deleteLoading={deleteLoading}
                      quizLoading={quizLoading}
                      onGenerateQuiz={generateQuiz}
                    />
                  ))}
                </div>

                {savedTranscripts.length > itemsPerPage && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={savedTranscripts.length}
                    itemName="transcripts"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ViewDialog
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        item={selectedTranscript}
        onEdit={handleEditTranscript}
        onTakeQuiz={handleTakeQuiz}
        itemType="transcript"
        titleProperty="title"
        contentProperty="content"
        dateProperty="createdAt"
        typeProperty="type"
      />

      <EditDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        item={editingTranscript}
        onSave={handleSaveEdit}
        loading={loading}
        itemType="transcript"
        titleProperty="title"
        contentProperty="content"
        idProperty="id"
      />
    </div>
  );
}

// Helper functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}
