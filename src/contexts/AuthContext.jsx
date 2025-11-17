import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSignup, setPendingSignup] = useState(null);
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user is authenticated by verifying the HTTP-only cookie
      const response = await fetch(`${backendURL}/api/auth/verify`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`,
          });
        }
      }
    } catch (error) {
      console.log("No existing session found");
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${backendURL}/api/auth/signIn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.user) {
        return {
          success: false,
          message: data.message || "Sign in failed",
        };
      }

      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`,
      };

      setUser(userData);

      return {
        success: true,
        message: "Sign in successful",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Sign in failed",
      };
    }
  };

  const signUp = async (name, email, password) => {
    const response = await fetch(`${backendURL}/api/auth/signUp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to send OTP");
    }

    // Store pending signup data for verification step
    setPendingSignup({ name, email, password });

    return {
      success: true,
      message: data.message || "OTP sent to your email",
    };
  };

  const verifySignUp = async (otp) => {
    // console.log(" verifySignUp called with OTP:", otp);

    if (!pendingSignup) {
      console.log(" ERROR: No pending signup found");
      throw new Error("No pending signup found. Please request OTP first.");
    }

    // console.log(" Pending signup data:", { email: pendingSignup.email });

    const response = await fetch(`${backendURL}/api/auth/verifySignUp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: pendingSignup.email,
        otp,
      }),
    });

    // console.log(" Response status:", response.status);
    // console.log(" Response ok:", response.ok);

    const data = await response.json();
    // console.log(" Response data:", data);

    if (!data.success) {
      console.log(" ERROR: Backend returned success=false");
      throw new Error(data.message || "OTP verification failed");
    }

    // console.log(" Verification successful, user data:", data.user);

    if (data.user) {
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`,
      };
      console.log(" Setting user state:", userData);
      setUser(userData);
    }

    setPendingSignup(null); // Clear pending signup data
    // console.log(" Cleared pending signup");

    return {
      success: true,
      message: "Account created successfully",
    };
  };

  const resendOtp = async () => {
    if (!pendingSignup) {
      throw new Error(
        "No pending signup found. Please start signup process again."
      );
    }

    return await signUp(
      pendingSignup.name,
      pendingSignup.email,
      pendingSignup.password
    );
  };

  const signOut = async () => {
    try {
      // console.log("Attempting to sign out...");

      await fetch(`${backendURL}/api/auth/signOut`, {
        method: "GET",
        credentials: "include",
      });

      // console.log("Backend signOut called successfully");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
      setPendingSignup(null);

      localStorage.clear();
      sessionStorage.clear();

      // console.log("User state and storage cleared completely");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp, // First step: sends OTP
        verifySignUp, // Second step: verifies OTP and creates account
        resendOtp, // Resend OTP if needed
        signOut,
        pendingSignup: !!pendingSignup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
