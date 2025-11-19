import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Brain,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowLeft,
  X,
  FileText,
  Mic,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

export default function Quizzes() {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [notes, setNotes] = useState([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [contentQuiz, setContentQuiz] = useState(null);
  const [contentQuizLoading, setContentQuizLoading] = useState(false);
  const [quizMode, setQuizMode] = useState(null);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const isCancelledRef = useRef(false);

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const backendURL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
    if (location.state?.generatedQuiz) {
      setGeneratedQuiz(location.state.generatedQuiz);
      toast.success("Quiz loaded from note/transcript!");
    }
    if (location.state?.quizContent) {
      setQuizMode("content");
      generateContentQuiz(location.state.quizContent);
    }
  }, [user, location.state]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${backendURL}/api/transcribe/getNotes`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    }
  };

  const generateQuiz = async () => {
    if (!selectedSource) {
      toast.error("Please select a source note");
      return;
    }

    setQuizMode("ai");
    setLoading(true);
    isCancelledRef.current = false;

    try {
      const selectedNote = notes.find((note) => note.title === selectedSource);
      if (!selectedNote) {
        toast.error("Selected note not found");
        return;
      }

      console.log(` Selected note for quiz generation:`);
      console.log(` - Title: ${selectedNote.title}`);
      console.log(` - Content length: ${selectedNote.content?.length || 0}`);
      console.log(
        ` - Content preview: ${selectedNote.content?.substring(0, 200)}...`
      );
      console.log(` - Question count: ${questionCount}`);

      console.log(
        ` Calling backend endpoint: ${backendURL}/api/transcribe/getQuiz`
      );
      const response = await fetch(`${backendURL}/api/transcribe/getQuiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: selectedNote.title,
          questionCount: Number.parseInt(questionCount),
        }),
      });

      if (isCancelledRef.current) {
        console.log(" Quiz generation was cancelled, aborting");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendResponse = await response.json();
      console.log(" Backend response object:", backendResponse);

      if (isCancelledRef.current) {
        console.log(" Quiz generation was cancelled, aborting");
        return;
      }

      let quizData;
      if (backendResponse.quiz && Array.isArray(backendResponse.quiz)) {
        quizData = backendResponse.quiz;
      } else if (typeof backendResponse.quiz === "string") {
        let cleanQuizData = backendResponse.quiz.trim();

        cleanQuizData = cleanQuizData
          .replace(/^\`\`\`json\s*/i, "")
          .replace(/^\`\`\`\s*/, "")
          .replace(/\s*\`\`\`$/g, "")
          .trim();

        console.log(" Cleaned quiz data from backend:", cleanQuizData);

        try {
          quizData = JSON.parse(cleanQuizData);
        } catch (parseError) {
          console.error(" Failed to parse quiz JSON:", parseError);
          throw new Error(`Failed to parse quiz data: ${parseError.message}`);
        }
      } else {
        throw new Error(
          `Unexpected backend response format: ${JSON.stringify(
            backendResponse
          )}`
        );
      }

      console.log(" Extracted quiz data:", quizData);

      if (!Array.isArray(quizData)) {
        throw new Error(
          `Quiz data is not an array. Received: ${typeof quizData}. Data: ${JSON.stringify(
            quizData
          )}`
        );
      }

      const formattedQuestions = quizData
        .map((q, index) => {
          console.log(` Processing question ${index + 1}:`, q);

          const questionText = q.question || q.q || `Question ${index + 1}`;

          let options = [];
          if (q.options && Array.isArray(q.options)) {
            options = q.options;
          } else if (q.option1 && q.option2) {
            options = [q.option1, q.option2, q.option3, q.option4].filter(
              Boolean
            );
          } else if (q.a && q.b) {
            options = [q.a, q.b, q.c, q.d].filter(Boolean);
          }

          const isPlaceholderOptions = options.every(
            (opt) =>
              typeof opt === "string" &&
              opt.trim().length <= 2 &&
              /^[A-D]$/i.test(opt.trim())
          );

          if (isPlaceholderOptions || options.length < 2) {
            console.warn(
              ` Question ${
                index + 1
              } has placeholder or insufficient options, skipping:`,
              options
            );
            return null;
          }

          options = options.filter(
            (opt) => opt && typeof opt === "string" && opt.trim().length > 0
          );

          if (options.length < 2) {
            console.warn(
              ` Question ${
                index + 1
              } has insufficient valid options after filtering:`,
              options
            );
            return null;
          }

          let correct = 0;
          if (typeof q.correct === "number") {
            correct = q.correct;
          } else if (typeof q.correctAnswer === "number") {
            correct = q.correctAnswer;
          } else if (typeof q.correctOption === "number") {
            correct = q.correctOption - 1;
          } else if (typeof q.answer === "string") {
            const answerIndex = options.findIndex((opt) => opt === q.answer);
            if (answerIndex !== -1) {
              correct = answerIndex;
            } else {
              const answerMap = {
                a: 0,
                b: 1,
                c: 2,
                d: 3,
                A: 0,
                B: 1,
                C: 2,
                D: 3,
              };
              correct =
                answerMap[q.answer] !== undefined ? answerMap[q.answer] : 0;
            }
          }

          correct = Math.max(0, Math.min(options.length - 1, correct));

          console.log(` Formatted question ${index + 1}:`, {
            question: questionText,
            options: options,
            correct: correct,
          });

          return {
            id: index + 1,
            type: "multiple-choice",
            question: questionText,
            options: options,
            correct: correct,
          };
        })
        .filter(Boolean);

      if (formattedQuestions.length === 0) {
        throw new Error(
          "No valid questions could be generated from the AI response"
        );
      }

      if (isCancelledRef.current) {
        console.log(" Quiz generation was cancelled, not displaying quiz");
        return;
      }

      setGeneratedQuiz({
        title: selectedSource,
        questions: formattedQuestions,
      });

      console.log(" Final formatted quiz:", formattedQuestions);
      toast.success(
        `AI Quiz generated successfully! ${formattedQuestions.length} questions created.`
      );
    } catch (error) {
      if (!isCancelledRef.current) {
        console.error(" Error in generateQuiz:", error);
        console.error(" Error details:", {
          message: error.message,
          stack: error.stack,
        });
        toast.error(`Failed to generate quiz: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateContentQuiz = async (content) => {
    setContentQuizLoading(true);
    isCancelledRef.current = false;

    try {
      console.log(` Generating AI quiz for content: ${content.title}`);

      const response = await fetch(`${backendURL}/api/transcribe/getQuiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: content.title,
          questionCount: 10,
        }),
      });

      if (isCancelledRef.current) {
        console.log(" Content quiz generation was cancelled, aborting");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendResponse = await response.json();
      console.log("[Backend response:", backendResponse);

      if (isCancelledRef.current) {
        console.log(" Content quiz generation was cancelled, aborting");
        return;
      }

      let quizData;
      if (backendResponse.quiz && Array.isArray(backendResponse.quiz)) {
        quizData = backendResponse.quiz;
      } else if (typeof backendResponse.quiz === "string") {
        let cleanQuizData = backendResponse.quiz.trim();
        cleanQuizData = cleanQuizData
          .replace(/^\`\`\`json\s*/i, "")
          .replace(/^\`\`\`\s*/, "")
          .replace(/\s*\`\`\`$/g, "")
          .trim();
        quizData = JSON.parse(cleanQuizData);
      } else {
        throw new Error(`Unexpected backend response format`);
      }

      if (!Array.isArray(quizData)) {
        throw new Error(`Quiz data is not an array`);
      }

      const formattedQuestions = quizData
        .map((q, index) => {
          const questionText = q.question || q.q || `Question ${index + 1}`;
          let options = [];

          if (q.options && Array.isArray(q.options)) {
            options = q.options;
          } else if (q.option1 && q.option2) {
            options = [q.option1, q.option2, q.option3, q.option4].filter(
              Boolean
            );
          } else if (q.a && q.b) {
            options = [q.a, q.b, q.c, q.d].filter(Boolean);
          }

          const isPlaceholderOptions = options.every(
            (opt) =>
              typeof opt === "string" &&
              opt.trim().length <= 2 &&
              /^[A-D]$/i.test(opt.trim())
          );

          if (isPlaceholderOptions || options.length < 2) {
            console.warn(
              ` Question ${
                index + 1
              } has placeholder or insufficient options, skipping`
            );
            return null;
          }

          options = options.filter(
            (opt) => opt && typeof opt === "string" && opt.trim().length > 0
          );

          if (options.length < 2) {
            console.warn(
              ` Question ${
                index + 1
              } has insufficient valid options after filtering`
            );
            return null;
          }

          let correct = 0;
          if (typeof q.correct === "number") {
            correct = q.correct;
          } else if (typeof q.correctAnswer === "number") {
            correct = q.correctAnswer;
          } else if (typeof q.correctOption === "number") {
            correct = q.correctOption - 1;
          } else if (typeof q.answer === "string") {
            const answerIndex = options.findIndex((opt) => opt === q.answer);
            if (answerIndex !== -1) {
              correct = answerIndex;
            } else {
              const answerMap = {
                a: 0,
                b: 1,
                c: 2,
                d: 3,
                A: 0,
                B: 1,
                C: 2,
                D: 3,
              };
              correct =
                answerMap[q.answer] !== undefined ? answerMap[q.answer] : 0;
            }
          }

          correct = Math.max(0, Math.min(options.length - 1, correct));

          return {
            id: index + 1,
            type: "multiple-choice",
            question: questionText,
            options: options,
            correct: correct,
          };
        })
        .filter(Boolean);

      if (formattedQuestions.length === 0) {
        throw new Error(
          "No valid questions could be generated from the AI response"
        );
      }

      if (isCancelledRef.current) {
        console.log(
          " Content quiz generation was cancelled, not displaying quiz"
        );
        return;
      }

      setContentQuiz({
        title: content.title,
        questions: formattedQuestions,
        sourceType: content.type,
        sourceTitle: content.title,
      });

      toast.success(
        `AI Quiz generated successfully! ${formattedQuestions.length} questions created.`
      );
    } catch (error) {
      if (!isCancelledRef.current) {
        console.error(" Error generating content quiz:", error);
        toast.error(`Failed to generate quiz: ${error.message}`);
      }
    } finally {
      setContentQuizLoading(false);
    }
  };

  const cancelQuizGeneration = () => {
    isCancelledRef.current = true;
    setQuizMode(null);
    setContentQuiz(null);
    setGeneratedQuiz(null);
    setContentQuizLoading(false);
    setLoading(false);
    setSelectedSource("");
    toast.info("Quiz generation cancelled");
  };

  const resetToMainView = () => {
    setActiveQuiz(null);
    setShowResults(false);
    setAnswers({});
    setCurrentQuestion(0);
    setQuizMode(null);
    setContentQuiz(null);
    setGeneratedQuiz(null);
  };

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleAnswer = (questionId, answer) => {
    console.log(` Setting answer for question ${questionId}:`, answer);
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const goToQuestion = (questionIndex) => {
    setCurrentQuestion(questionIndex);
    setShowQuestionNav(false);
  };

  const calculateScore = () => {
    let correct = 0;
    const currentQuizQuestions = activeQuiz.questions;
    console.log(" Calculating score with answers:", answers);

    currentQuizQuestions.forEach((q) => {
      const userAnswer = answers[q.id];
      console.log(
        ` Question ${q.id}: user answer = ${userAnswer}, correct = ${q.correct}`
      );

      if (q.type === "multiple-choice" && userAnswer === q.correct) correct++;
      if (q.type === "true-false" && userAnswer === q.correct) correct++;
      if (q.type === "short-answer" && userAnswer?.trim()) correct++;
    });

    console.log(` Final score: ${correct}/${currentQuizQuestions.length}`);
    return Math.round((correct / currentQuizQuestions.length) * 100);
  };

  useEffect(() => {
    if (showResults && activeQuiz) {
      const score = calculateScore();
      saveQuizScore(score);
    }
  }, [showResults, activeQuiz]);

  const saveQuizScore = async (score) => {
    try {
      let quizTitle = activeQuiz.title;
      if (quizTitle.startsWith("AI Quiz: ")) {
        quizTitle = quizTitle.replace("AI Quiz: ", "");
      } else if (quizTitle.startsWith("Quiz: ")) {
        quizTitle = quizTitle.replace("Quiz: ", "");
      }

      console.log(" Saving quiz score:", {
        originalTitle: activeQuiz.title,
        cleanedTitle: quizTitle,
        score,
        totalQuestions: activeQuiz.questions.length,
      });

      const payload = {
        title: quizTitle,
        score: score,
      };

      console.log(" Sending payload to:", `${backendURL}/api/transcribe/score`);
      console.log(" Payload:", payload);

      const response = await fetch(`${backendURL}/api/transcribe/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log(" Response status:", response.status);
      console.log(" Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(" Backend error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log(" Backend response data:", data);

      if (data.success) {
        console.log(" Quiz score saved successfully");
        toast.success("Quiz score saved!");
      } else {
        console.error(" Backend returned success: false", data);
        toast.error(
          "Failed to save quiz score: " + (data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error(" Error saving quiz score:", error);
      toast.error("Failed to save quiz score: " + error.message);
    }
  };

  if (activeQuiz && !showResults) {
    const question = activeQuiz.questions[currentQuestion];
    const progress =
      ((currentQuestion + 1) / activeQuiz.questions.length) * 100;

    console.log(" Current question:", question);
    console.log(" Question options:", question.options);
    console.log(" Current answers state:", answers);

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveQuiz(null)}
                className="gap-1 sm:gap-2"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Back</span>
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold truncate">
                {activeQuiz.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Q {currentQuestion + 1}/{activeQuiz.questions.length}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuestionNav(!showQuestionNav)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                Navigate
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mb-2" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Progress: {Math.round(progress)}%
          </p>

          {showQuestionNav && (
            <Card className="mt-4">
              <CardContent className="p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                  Jump to Question:
                </h3>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 sm:gap-2">
                  {activeQuiz.questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={
                        currentQuestion === index
                          ? "default"
                          : answers[activeQuiz.questions[index].id] !==
                            undefined
                          ? "secondary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => goToQuestion(index)}
                      className={`h-7 sm:h-8 text-xs sm:text-sm ${
                        currentQuestion === index ? "text-white" : ""
                      }`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg leading-relaxed">
              {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-2.5 p-3 sm:p-4 pt-2 sm:pt-3">
            {question.type === "multiple-choice" && (
              <RadioGroup
                value={answers[question.id]?.toString() || ""}
                onValueChange={(value) => {
                  console.log(" RadioGroup value changed:", value);
                  handleAnswer(question.id, Number.parseInt(value));
                }}
                className="space-y-2 sm:space-y-2.5"
              >
                {question.options?.map((option, index) => {
                  console.log(" Rendering option:", index, option);
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => {
                        console.log(" Option clicked:", index, option);
                        handleAnswer(question.id, index);
                      }}
                    >
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${index}`}
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer text-xs sm:text-sm font-medium leading-relaxed"
                      >
                        {option || `Option ${index + 1} (empty)`}
                      </Label>
                    </div>
                  );
                }) || (
                  <div className="text-red-500 text-sm">
                    No options available for this question
                  </div>
                )}
              </RadioGroup>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 pt-3 sm:pt-4">
              <div className="flex gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveQuiz(null)}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Exit Quiz
                </Button>
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={currentQuestion === 0}
                  className="gap-1 sm:gap-2 bg-transparent flex-1 sm:flex-none text-xs sm:text-sm"
                  size="sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  Previous
                </Button>
              </div>
              <Button
                onClick={nextQuestion}
                className="text-white text-xs sm:text-sm w-full sm:w-auto"
                disabled={answers[question.id] === undefined}
                size="sm"
              >
                {currentQuestion === activeQuiz.questions.length - 1
                  ? "Finish Quiz"
                  : "Next Question"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const correctAnswers = Math.round(
      (score / 100) * activeQuiz.questions.length
    );

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Quiz Complete!</CardTitle>
            <div className="text-4xl font-bold mb-2 text-green-600">
              {score}%
            </div>
            <CardDescription>
              You scored {correctAnswers} out of {activeQuiz.questions.length}{" "}
              questions correctly
            </CardDescription>
            <div className="mt-4">
              <Badge
                variant={
                  score >= 80
                    ? "default"
                    : score >= 60
                    ? "secondary"
                    : "destructive"
                }
              >
                {score >= 80
                  ? "Excellent!"
                  : score >= 60
                  ? "Good Job!"
                  : "Keep Practicing!"}
              </Badge>
            </div>

            <div className="mt-6 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-center gap-3 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span className="text-sm text-green-600">
                  Score saved to analytics!
                </span>
              </div>
              <div className="text-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/analytics")}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  View Analytics Dashboard →
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review Your Answers</h3>
              {activeQuiz.questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correct;

                return (
                  <Card
                    key={question.id}
                    className={`border-l-4 ${
                      isCorrect ? "border-l-green-500" : "border-l-red-500"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-2">
                            Q{index + 1}: {question.question}
                          </p>
                          <div className="space-y-1 text-sm">
                            <p className="text-green-600">
                              <strong>Correct:</strong>{" "}
                              {question.options[question.correct]}
                            </p>
                            <p
                              className={
                                userAnswer !== undefined
                                  ? "text-red-600"
                                  : "text-gray-500"
                              }
                            >
                              <strong>Your answer:</strong>{" "}
                              {userAnswer !== undefined
                                ? question.options[userAnswer]
                                : "Not answered"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => startQuiz(activeQuiz)}
                className="gap-2 text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Retake Quiz
              </Button>
              <Button variant="outline" onClick={resetToMainView}>
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[85vh]">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex-1">
            {quizMode === "content" ? (
              <>
                <h1 className="text-xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span className="leading-tight">
                    Generating Quiz from Content
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Creating a quick quiz from your selected content
                </p>
              </>
            ) : quizMode === "ai" ? (
              <>
                <h1 className="text-xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
                  <Brain className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span className="leading-tight">Generating AI Quiz</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Creating a comprehensive AI-powered quiz
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
                  <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  <span className="leading-tight">Quiz Center</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Create and take quizzes from your notes and transcripts
                </p>
              </>
            )}
          </div>
        </div>

        {contentQuiz && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                {contentQuiz.sourceType === "note" ? (
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="truncate">{contentQuiz.title}</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Generated from your {contentQuiz.sourceType}: "
                {contentQuiz.sourceTitle}" - Ready to take!
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-2 sm:pt-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm">
                    {contentQuiz.questions.length} questions
                  </p>
                  <p className="text-xs sm:text-sm">
                    Estimated time:{" "}
                    {Math.ceil(contentQuiz.questions.length * 1.5)} minutes
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={cancelQuizGeneration}
                    size="sm"
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => startQuiz(contentQuiz)}
                    className="gap-2 text-white flex-1 sm:flex-none text-xs sm:text-sm"
                    size="sm"
                  >
                    <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                    Start Quiz
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!quizMode && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Plus className="h-4 w-4 sm:h-5" />
                Generate AI Quiz
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Create a comprehensive quiz from your existing notes or
                transcripts using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="sm:p-2 sm:px-4">
              <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto] gap-3 sm:gap-4">
                <Select
                  value={selectedSource}
                  onValueChange={setSelectedSource}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {notes.map((note) => (
                      <SelectItem key={note._id} value={note.title}>
                        <span
                          className="block truncate max-w-[250px] sm:max-w-[400px]"
                          title={note.title}
                        >
                          {note.title}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={generateQuiz}
                  disabled={loading}
                  className="gap-2 text-white cursor-pointer w-full sm:w-auto whitespace-nowrap text-xs sm:text-sm"
                  size="sm"
                >
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                  {loading ? "Generating..." : "Generate AI Quiz"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {generatedQuiz && (
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">{generatedQuiz.title}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              AI-generated comprehensive quiz ready to take
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm">
                  {generatedQuiz.questions.length} questions
                </p>
                <p className="text-xs sm:text-sm text-primary">
                  Estimated time:{" "}
                  {Math.ceil(generatedQuiz.questions.length * 1.5)} minutes
                </p>
              </div>
              <div className="my-2 sm:my-0 flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetToMainView}
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => startQuiz(generatedQuiz)}
                  className="gap-2 text-white flex-1 sm:flex-none text-xs sm:text-sm"
                  size="sm"
                >
                  <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                  Start Quiz
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {contentQuizLoading && (
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse" />
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-medium mb-2">
              Generating Quiz
            </h3>
            <p className="text-xs sm:text-sm mb-3 sm:mb-4">
              Analyzing your content and creating questions...
            </p>
            <Button
              variant="outline"
              onClick={cancelQuizGeneration}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Cancel Generation
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse" />
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2"></div>
            </div>
            <h3 className="text-base sm:text-lg font-medium mb-2">
              Generating AI Quiz
            </h3>
            <p className="text-xs sm:text-sm mb-3 sm:mb-4">
              AI is analyzing "{selectedSource}" and creating comprehensive
              questions...
            </p>
            <Button
              variant="outline"
              onClick={cancelQuizGeneration}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Cancel Generation
            </Button>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !contentQuiz && !quizMode && (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No notes available</h3>
          <p className="text-muted-foreground mb-4">
            Create some notes or transcripts first to generate quizzes
          </p>
          <Button onClick={() => navigate("/notes")} variant="outline">
            Go to Notes
          </Button>
        </div>
      )}
    </div>
  );
}
