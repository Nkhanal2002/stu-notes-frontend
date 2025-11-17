import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInSkeleton } from "@/components/skeletons/AuthSkeleton";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <SignInSkeleton />;
  }

  const validateEmail = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${backendURL}/api/auth/forgotPassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsOtpSent(true);
        toast.success("Password reset OTP sent to your email!");
        // Navigate to reset password page with email
        setTimeout(() => {
          navigate("/reset-password", { state: { email } });
        }, 2000);
      } else {
        toast.error(
          data.message || "Failed to send reset email. Please try again."
        );
        setErrors({ general: data.message || "Failed to send reset email" });
      }
    } catch (error) {
      toast.error("Network error. Please check your connection and try again.");
      setErrors({ general: "Network error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary p-3 rounded-xl">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Forgot Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isOtpSent
              ? "Check your email for the reset code"
              : "Enter your email to receive a password reset code"}
          </p>
        </div>

        <Card className="shadow-xl border-0 dark:border bg-background backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              {isOtpSent ? "OTP Sent!" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {isOtpSent
                ? "We've sent a 6-digit code to your email address"
                : "We'll send you a code to reset your password"}
            </CardDescription>
          </CardHeader>

          {!isOtpSent ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                    {errors.general}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) {
                          setErrors((prev) => ({ ...prev, email: "" }));
                        }
                      }}
                      className={`pl-10 ${
                        errors.email
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>

                <div className="flex items-center justify-center space-x-2 text-sm">
                  <ArrowLeft className="h-4 w-4" />
                  <Link
                    to="/sign-in"
                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We've sent a 6-digit verification code to:
                </p>
                <p className="font-semibold text-gray-900 dark:text-white mb-6">
                  {email}
                </p>
                <Button
                  onClick={() =>
                    navigate("/reset-password", { state: { email } })
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  Continue to Reset Password
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
