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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  Clock,
  Award,
  BarChart3,
  ArrowLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Pagination from "../components/Pagination";

export default function Analytics() {
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseList, setCourseList] = useState([]);
  const [coursePage, setCoursePage] = useState(1);
  const [courseItemsPerPage, setCourseItemsPerPage] = useState(6);
  const [courseSearch, setCourseSearch] = useState("");

  const backendURL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const courseFromUrl = params.get("course");
    if (courseFromUrl) {
      setSelectedCourse(decodeURIComponent(courseFromUrl));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedCourse) {
      params.set("course", encodeURIComponent(selectedCourse));
    } else {
      params.delete("course");
    }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [selectedCourse]);

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
        const coursesWithData = [];

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
                if (!coursesWithData.includes(title)) {
                  coursesWithData.push(title);
                }
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
        setCourseList(coursesWithData);
      } catch (err) {
        console.error("Error fetching quiz data:", err);
        setError(err.message || "Failed to load quiz analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [user, backendURL]);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth >= 768 ? 4 : 3);
      setCourseItemsPerPage(window.innerWidth >= 768 ? 6 : 3);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, selectedCourse, timeRange]);

  useEffect(() => {
    setCoursePage(1);
  }, [courseSearch, courseItemsPerPage]);

  const courseFilteredData = selectedCourse
    ? quizData.filter((quiz) => quiz.title === selectedCourse)
    : quizData;

  const filteredQuizData = courseFilteredData.filter((quiz) => {
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
    const latestScore = filteredQuizData[filteredQuizData.length - 1].score;
    const firstScore = filteredQuizData[0].score;
    return latestScore - firstScore;
  }

  // Prepare chart data for Recharts
  const lineChartData = filteredQuizData.map((quiz, index) => ({
    name: `Q${index + 1}`,
    score: quiz.score,
    date: new Date(quiz.createdAt).toLocaleDateString(),
  }));

  const barChartData = filteredQuizData.reduce((acc, quiz) => {
    const cappedScore = Math.min(quiz.score, 100);
    const scoreRange = Math.floor(cappedScore / 10) * 10;
    const range =
      cappedScore === 100 ? "90-100%" : `${scoreRange}-${scoreRange + 9}%`;
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(barChartData)
    .sort(([rangeA], [rangeB]) => {
      const getStartValue = (range) => Number.parseInt(range.split("-")[0]);
      return getStartValue(rangeA) - getStartValue(rangeB);
    })
    .map(([range, count]) => ({
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
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
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

  if (!selectedCourse && courseList.length > 0) {
    const filteredCourses = courseList.filter((course) =>
      course.toLowerCase().includes(courseSearch.toLowerCase())
    );

    const courseTotalPages = Math.ceil(
      filteredCourses.length / courseItemsPerPage
    );
    const courseStartIndex = (coursePage - 1) * courseItemsPerPage;
    const paginatedCourses = filteredCourses.slice(
      courseStartIndex,
      courseStartIndex + courseItemsPerPage
    );

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen bg-background">
        <div className="mb-8">
          <h1 className="text-xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Quiz Analytics by Course
          </h1>
          <p className="text-muted-foreground">
            Select a course to view detailed analytics
          </p>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCourses.map((course) => {
            const courseQuizzes = quizData.filter((q) => q.title === course);
            const courseAvg = Math.round(
              courseQuizzes.reduce((sum, q) => sum + q.score, 0) /
                courseQuizzes.length
            );
            const latestScore =
              courseQuizzes[courseQuizzes.length - 1]?.score || 0;

            return (
              <Card
                key={course}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedCourse(course)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">
                    {course}
                  </CardTitle>
                  <CardDescription>
                    {courseQuizzes.length}{" "}
                    {courseQuizzes.length === 1 ? "quiz" : "quizzes"} taken
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Average Score
                      </span>
                      <Badge
                        className={`${courseAvg >= 80 ? "text-white" : ""}`}
                        variant={
                          courseAvg >= 80
                            ? "default"
                            : courseAvg >= 60
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {courseAvg}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Latest Score
                      </span>
                      <Badge variant="outline">{latestScore}%</Badge>
                    </div>
                    <Button
                      className="w-full mt-2 bg-transparent"
                      variant="outline"
                    >
                      View Analytics
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {courseTotalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={coursePage}
              totalPages={courseTotalPages}
              onPageChange={setCoursePage}
            />
          </div>
        )}

        {filteredCourses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No courses found matching "{courseSearch}"
          </div>
        )}
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

  const generateQuizColors = (count) => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
      "#f97316",
      "#6366f1",
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  };

  const columnChartData = filteredQuizData.map((quiz, index) => ({
    name: `Quiz ${index + 1}`,
    score: quiz.score,
    date: new Date(quiz.createdAt).toLocaleDateString(),
    fill: generateQuizColors(filteredQuizData.length)[index],
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen bg-background">
      {/* Header with back button */}
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3 flex-wrap">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <span className="truncate">{selectedCourse}</span>
          </h1>
          <p className="text-muted-foreground mb-4">
            Course analytics and performance insights
          </p>
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedCourse(null)}
              className="flex-shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2 text-primary" />
              <span className="hidden sm:inline font-medium">
                Back to courses
              </span>
              <span className="sm:hidden font-medium">Back</span>
            </Button>
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
      </div>

      {totalQuizzes === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No quiz data for this time range
            </h3>
            <p className="text-muted-foreground mb-4">
              Try selecting a different time range or take more quizzes
            </p>
            <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-center">
              <Button
                onClick={() => setSelectedCourse(null)}
                variant="outline"
                className="mr-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Button>
              <Button
                onClick={() => (window.location.href = "/quizzes")}
                className="text-white"
              >
                Take More Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="px-4 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">
                      Total Quizzes
                    </p>
                    <p className="text-base sm:text-xl md:text-2xl font-bold">
                      {totalQuizzes}
                    </p>
                  </div>
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-2">
              <CardContent className="px-4 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">
                      Average Score
                    </p>
                    <p className="text-base sm:text-xl md:text-2xl font-bold">
                      {averageScore}%
                    </p>
                  </div>
                  <Target className="h-6 w-6 md:h-8 md:w-8 text-chart-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-3">
              <CardContent className="px-4 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">
                      Highest Score
                    </p>
                    <p className="text-base sm:text-xl md:text-2xl font-bold">
                      {highestScore}%
                    </p>
                  </div>
                  <Award className="h-6 w-6 md:h-8 md:w-8 text-chart-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-4">
              <CardContent className="px-4 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">
                      Improvement
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-base sm:text-xl md:text-2xl font-bold">
                        {improvementTrend > 0 ? "+" : ""}
                        {improvementTrend}%
                      </p>
                      {improvementTrend > 0 ? (
                        <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                      ) : improvementTrend < 0 ? (
                        <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  <Clock className="h-6 w-6 md:h-8 md:w-8 text-chart-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Quiz Results */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Recent Quiz Results</CardTitle>
                <CardDescription>Your latest quiz performances</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  {paginatedQuizzes.length > 0 ? (
                    paginatedQuizzes.map((quiz, index) => (
                      <div
                        key={startIndex + index}
                        className="flex flex-row items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent transition-colors gap-2 sm:gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base truncate">
                            {quiz.title}
                          </h4>
                          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-0.5">
                            <span>
                              {new Date(quiz.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(quiz.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            quiz.score >= 90
                              ? "default"
                              : quiz.score >= 70
                              ? "secondary"
                              : "destructive"
                          }
                          className={` text-sm sm:text-base px-2 py-0.5 sm:px-2.5 sm:py-1 ${
                            quiz.score >= 90 ? "text-white" : ""
                          }`}
                        >
                          {quiz.score}%
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No quizzes in this time range
                    </p>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 mb-2">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Column Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Performance Overview</CardTitle>
                <CardDescription>
                  Individual score for each quiz attempt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={columnChartData}
                      margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        angle={filteredQuizData.length > 8 ? -45 : 0}
                        textAnchor={
                          filteredQuizData.length > 8 ? "end" : "middle"
                        }
                        height={80}
                        interval={0}
                        tick={{ fontSize: 12 }}
                        label={{
                          value: "Quiz Attempts",
                          position: "inside",
                          offset: -10,
                          style: { fontSize: 14, fontWeight: 600 },
                        }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        label={{
                          value: "Score (%)",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: 14, fontWeight: 600 },
                        }}
                      />
                      <Tooltip
                        cursor={false}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">
                                  {payload[0].payload.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {payload[0].payload.date}
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  {payload[0].value}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="score"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                        activeBar={{ fillOpacity: 0.6 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Score Progression</CardTitle>
              <CardDescription>
                Your improvement journey over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={lineChartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient
                        id="scoreGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      label={{
                        value: "Quiz Number",
                        position: "insideBottom",
                        offset: -10,
                        style: { fontSize: 14, fontWeight: 600 },
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#6b7280"
                      label={{
                        value: "Score (%)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 14, fontWeight: 600 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">
                                {payload[0].payload.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {payload[0].payload.date}
                              </p>
                              <p className="text-lg font-bold text-green-500">
                                {payload[0].value}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#scoreGradient)"
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#10b981" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
