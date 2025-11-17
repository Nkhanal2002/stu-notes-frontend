import { Link } from "react-router-dom";
import { GraduationCap, Github, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                StuNotes
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link
              to="/transcribe"
              className="hover:text-emerald-600 transition-colors"
            >
              Transcribe
            </Link>
            <Link
              to="/notes"
              className="hover:text-emerald-600 transition-colors"
            >
              Notes
            </Link>
            <Link
              to="/quizzes"
              className="hover:text-emerald-600 transition-colors"
            >
              Quizzes
            </Link>
            <Link
              to="/analytics"
              className="hover:text-emerald-600 transition-colors"
            >
              Analytics
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-muted-foreground hover:text-emerald-600 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-emerald-600 transition-colors"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} StuNotes. All rights reserved. Built for
          students, by students.
        </div>
      </div>
    </footer>
  );
}
