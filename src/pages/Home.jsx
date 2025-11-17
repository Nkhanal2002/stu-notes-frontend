import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Mic,
  FileText,
  Sparkles,
  Brain,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  Zap,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Mic,
      title: "Smart Transcription",
      description:
        "Record lectures and get accurate, real-time transcriptions with speaker identification.",
      color: "bg-blue-500",
      route: "/transcribe",
    },
    {
      icon: FileText,
      title: "Intelligent Notes",
      description:
        "Take organized notes with rich formatting, tags, and seamless integration with transcripts.",
      color: "bg-primary",
      route: "/notes",
    },
    {
      icon: Brain,
      title: "Quiz Generation",
      description:
        "Generate personalized quizzes from your notes and transcripts to test your knowledge.",
      color: "bg-orange-500",
      route: "/quizzes",
    },
    {
      icon: BarChart3,
      title: "Quiz Analytics",
      description:
        "Monitor your learning progress with detailed analytics and performance insights.",
      color: "bg-pink-500",
      route: "/analytics",
    },
  ];

  const stats = [
    { icon: Users, value: "10K+", label: "Active Students" },
    { icon: Clock, value: "500K+", label: "Hours Transcribed" },
    { icon: CheckCircle, value: "1M+", label: "Quizzes Generated" },
    { icon: Zap, value: "98%", label: "Accuracy Rate" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            AI-Powered Study Assistant
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Transform Your
            <span className="text-primary"> Learning </span>
            Experience
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            StuNotes combines audio transcription, intelligent note-taking, and
            AI-powered quiz generation to help students study more effectively
            and achieve better results.
          </p>
          <div className="mx-auto">
            <Button size="lg" className="text-white font-semibold" asChild>
              <Link to="/transcribe">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to enhance every aspect of your study
              routine
            </p>
          </div>

          <div className="sm:mx-auto sm:max-w-[65vw] grid sm:grid-cols-2 gap-5 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link key={index} to={feature.route} className="block">
                  <Card className="border-border hover:shadow-lg hover:scale-100 transition-all duration-200 cursor-pointer h-full sm:max-w-[30rem] sm:mx-auto">
                    <CardHeader>
                      <div
                        className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-2`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl mb-[-1rem]">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
