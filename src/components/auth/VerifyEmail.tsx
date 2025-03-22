import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  return (
    <div className="flex flex-col items-center">
      <Link href="/" className="flex items-center mb-8">
        <Clock className="h-8 w-8 mr-2 text-purple-400" />
        <span className="text-2xl font-bold text-white">FocusTimer</span>
      </Link>
      
      <Card className="w-full max-w-md bg-[#1a1a2e] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Check your email</CardTitle>
          <CardDescription className="text-gray-400">
            We've sent you a verification link. Please check your email to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            Once verified, you can return to the app and sign in with your credentials.
          </p>
          
          <div className="pt-4">
            <Link href="/auth/sign-in">
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                Return to sign in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}