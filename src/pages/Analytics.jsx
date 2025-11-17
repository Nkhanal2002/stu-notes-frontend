import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  Clock,
  Award,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Pagination from "../components/Pagination";

export default function Analytics() {
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("all"); // Declare timeRange and setTimeRange
  const [currentPage, setCurrentPage] = useState(1);
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const itemsPerPage = 4;

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const notesRes = await fetch(`${backendURL}/api/transcribe/getNotes`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!notesRes.ok) throw new Error("Failed to fetch notes");

        const notesData = await notesRes.json();

        if (!notesData.success) throw new Error("Failed to get notes");

        const titles = [...new Set(notesData.notes.map((note) => note.title))];

        const allQuizzes = [];
        for (const title of titles) {
          try {
            const analysisRes = await fetch(
              `${backendURL}/api/transcribe/quizAnalysis`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ title }),
              }
            );

            if (analysisRes.ok) {
              const analysisData = await analysisRes.json();

              if (
                analysisData.success &&
                analysisData.quizzes &&
                analysisData.quizzes.length > 0
              ) {
                const quizzesForTitle = analysisData.quizzes.map((item) => ({
                  title: title,
                  score: item.score,
                  createdAt: item.createdAt,
                }));
                allQuizzes.push(...quizzesForTitle);
              }
            }
          } catch (err) {
            // Silently skip failed quiz analysis
          }
        }

        allQuizzes.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setQuizData(allQuizzes);
      } catch (err) {
        console.error("Error fetching quiz data:", err);
        setError(err.message || "Failed to load quiz analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [user]);

  const filteredQuizData = quizData.filter((quiz) => {
    const quizDate = new Date(quiz.createdAt);
    const now = new Date();
    const daysDiff = (now - quizDate) / (1000 * 60 * 60 * 24);

    switch (timeRange) {
      case "7d":
        return daysDiff <= 7;
      case "30d":
        return daysDiff <= 30;
      case "90d":
        return daysDiff <= 90;
      case "all":
      default:
        return true;
    }
  });

  // Calculate metrics
  const totalQuizzes = filteredQuizData.length;
  const averageScore =
    totalQuizzes > 0
      ? Math.round(
          filteredQuizData.reduce((sum, quiz) => sum + quiz.score, 0) /
            totalQuizzes
        )
      : 0;
  const highestScore =
    totalQuizzes > 0 ? Math.max(...filteredQuizData.map((q) => q.score)) : 0;
  const improvementTrend = calculateTrend();

  function calculateTrend() {
    if (filteredQuizData.length < 2) return 0;
    const recent =
      filteredQuizData.slice(-5).reduce((sum, q) => sum + q.score, 0) /
      Math.min(5, filteredQuizData.length);
    const older =
      filteredQuizData.slice(0, -5).reduce((sum, q) => sum + q.score, 0) /
      Math.max(1, filteredQuizData.length - 5);
    return Math.round(recent - older);
  }

  // Prepare chart data for Recharts
  const lineChartData = filteredQuizData.map((quiz, index) => ({
    name: `Q${index + 1}`,
    score: quiz.score,
    date: new Date(quiz.createdAt).toLocaleDateString(),
  }));

  const barChartData = filteredQuizData.reduce((acc, quiz) => {
    const scoreRange = Math.floor(quiz.score / 10) * 10;
    const range = `${scoreRange}-${scoreRange + 9}%`;
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(barChartData).map(([range, count]) => ({
    range,
    count,
  }));

  const pieData = [
    {
      name: "Excellent (90-100%)",
      value: filteredQuizData.filter((q) => q.score >= 90).length,
    },
    {
      name: "Good (80-89%)",
      value: filteredQuizData.filter((q) => q.score >= 80 && q.score < 90)
        .length,
    },
    {
      name: "Fair (70-79%)",
      value: filteredQuizData.filter((q) => q.score >= 70 && q.score < 80)
        .length,
    },
    {
      name: "Needs Work (<70%)",
      value: filteredQuizData.filter((q) => q.score < 70).length,
    },
  ].filter((item) => item.value > 0);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen bg-background">
        <Card className="text-center py-12 border-red-200 bg-red-50">
          <CardContent>
            <div className="text-red-600 mb-4">Error loading analytics</div>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentQuizzes = filteredQuizData.slice().reverse();
  const totalPages = Math.ceil(recentQuizzes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuizzes = recentQuizzes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Quiz Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your learning progress and performance insights
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalQuizzes === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No quiz data yet</h3>
            <p className="text-muted-foreground mb-4">
              Take some quizzes to see your analytics here
            </p>
            <Button
              onClick={() => (window.location.href = "/quizzes")}
              className="text-white"
            >
              Take Your First Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Quizzes
                    </p>
                    <p className="text-2xl font-bold">{totalQuizzes}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Average Score
                    </p>
                    <p className="text-2xl font-bold">{averageScore}%</p>
                  </div>
                  <Target className="h-8 w-8 text-chart-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-3">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Highest Score
                    </p>
                    <p className="text-2xl font-bold">{highestScore}%</p>
                  </div>
                  <Award className="h-8 w-8 text-chart-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Improvement
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">
                        {Math.abs(improvementTrend)}%
                      </p>
                      {improvementTrend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : improvementTrend < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-chart-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Score Trend Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Score Progression</CardTitle>
                <CardDescription>Your quiz scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        name="Score (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>
                  How your scores are distributed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        name="Number of Quizzes"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Pie Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Performance Breakdown</CardTitle>
                <CardDescription>
                  Distribution of your quiz grades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        style={{ fontSize: "14px", fontWeight: "600" }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: "14px" }}
                        formatter={(value, entry) =>
                          `${value}: ${entry.payload.value}`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Quizzes */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Quiz Results</CardTitle>
                <CardDescription>Your latest quiz performances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paginatedQuizzes.length > 0 ? (
                    paginatedQuizzes.map((quiz, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border gap-2 sm:gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <Badge
                              variant={
                                quiz.score >= 80
                                  ? "default"
                                  : quiz.score >= 60
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-sm"
                            >
                              {quiz.score}%
                            </Badge>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate sm:whitespace-normal">
                              {quiz.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(quiz.createdAt).toLocaleDateString()}
                              <span className="sm:hidden">
                                {" "}
                                •{" "}
                                {new Date(quiz.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="hidden sm:block text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(quiz.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No quizzes in this time range
                    </p>
                  )}
                </div>
                {recentQuizzes.length > itemsPerPage && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={recentQuizzes.length}
                    itemName="quizzes"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
