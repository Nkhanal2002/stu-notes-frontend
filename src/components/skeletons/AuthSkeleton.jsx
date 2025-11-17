import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function SignInSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header Skeleton */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        <Card className="shadow-xl border-0 bg-background dark:border backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <Skeleton className="h-7 w-32 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Email Field Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Password Field Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export function SignUpSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {/* Logo and Header Skeleton */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>

        <Card className="shadow-xl border-0 bg-background dark:border backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <Skeleton className="h-7 w-40 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Name Field Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Email Field Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Password Field Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
              {/* Password Strength Skeleton */}
              <div className="space-y-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-1 flex-1" />
                  ))}
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
            </div>

            {/* Confirm Password Field Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Terms Checkbox Skeleton */}
            <div className="flex items-start space-x-2">
              <Skeleton className="h-4 w-4 rounded mt-1" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-52 mx-auto" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
