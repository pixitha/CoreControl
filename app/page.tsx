"use client";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
 
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import axios from "axios";


export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [error, setError] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  interface LoginResponse {
    token: string;
  }

  const login = async () => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { token } = response.data as LoginResponse;
      Cookies.set('token', token);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.response.data.error);
      setErrorVisible(true)
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center gap-6 ">
      <Card className="w-1/3">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email and password to login.
          </CardDescription>
        </CardHeader>
        <CardContent>
        {errorVisible && (
          <>
            <div className="pb-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          </>
        )}

          <div>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@example.com"
                  required
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" type="password" required placeholder="* * * * * * *" onChange={(e) => setPassword(e.target.value)}/>
              </div>
              <Button className="w-full" onClick={login}>
                Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
