import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const inputRefs = useRef([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { verifySignUp, resendOtp } = useAuth();

  const { email, name, password } = location.state || {};

  useEffect(() => {
    if (!email || !name || !password) {
      toast.error("Invalid verification session. Please sign up again.");
      navigate("/sign-up");
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, name, password, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifySignUp(otpString);

      toast.success("Email verified! Account created successfully.");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Invalid verification code");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);

    try {
      const result = await resendOtp();

      toast.success("New verification code sent!");
      setTimeLeft(300); // Reset timer
      setOtp(["", "", "", "", "", ""]); // Clear current OTP
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary p-3 rounded-xl">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Verify Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            We've sent a 6-digit code to{" "}
            <span className="font-semibold">{email}</span>
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-background dark:border backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              Enter Verification Code
            </CardTitle>
            <CardDescription className="text-center">
              Code expires in {formatTime(timeLeft)}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleVerify}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-center block">
                  Verification Code
                </Label>
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold"
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={isResending || timeLeft > 0}
                  className="text-primary hover:text-primary/80"
                >
                  {isResending
                    ? "Sending..."
                    : timeLeft > 0
                    ? `Resend in ${formatTime(timeLeft)}`
                    : "Resend Code"}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={isLoading || otp.join("").length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Verify & Create Account"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/sign-up")}
                className="w-full text-gray-600 dark:text-gray-400"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign Up
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
