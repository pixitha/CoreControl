import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardHeader } from "@/components/ui/card";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [oldPassword, setOldPassword] = useState<string>("")

  const [emailError, setEmailError] = useState<string>("")
  const [passwordError, setPasswordError] = useState<string>("")
  const [emailErrorVisible, setEmailErrorVisible] = useState<boolean>(false)
  const [passwordErrorVisible, setPasswordErrorVisible] = useState<boolean>(false)

  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false)
  const [emailSuccess, setEmailSuccess] = useState<boolean>(false)

  const changeEmail = async () => {
    setEmailErrorVisible(false);
    setEmailSuccess(false);
    setEmailError("");

    if (!email) {
      setEmailError("Email is required");
      setEmailErrorVisible(true);
      setTimeout(() => {
        setEmailErrorVisible(false);
        setEmailError("");
      }
      , 3000);
      return;
    }
    try {
      await axios.post('/api/auth/edit_email', {
        newEmail: email,
        jwtToken: Cookies.get('token')
      });
      setEmailSuccess(true);
      setEmail("");
      setTimeout(() => {
        setEmailSuccess(false);
      }, 3000);
    } catch (error: any) {
      setEmailError(error.response.data.error);
      setEmailErrorVisible(true);
      setTimeout(() => {
        setEmailErrorVisible(false);
        setEmailError("");
      }, 3000);      
    }
  }

  const changePassword = async () => {
    try {
      if (password !== confirmPassword) {
        setPasswordError("Passwords do not match");
        setPasswordErrorVisible(true);
        setTimeout(() => {
          setPasswordErrorVisible(false);
          setPasswordError("");
        }, 3000);
        return;
      }
      if (!oldPassword || !password || !confirmPassword) {
        setPasswordError("All fields are required");
        setPasswordErrorVisible(true);
        setTimeout(() => {
          setPasswordErrorVisible(false);
          setPasswordError("");
        }, 3000);
        return;
      }

      const response = await axios.post('/api/auth/edit_password', {
        oldPassword: oldPassword,
        newPassword: password,
        jwtToken: Cookies.get('token')
      });
      
      if (response.status === 200) {
        setPasswordSuccess(true);
        setPassword("");
        setOldPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setPasswordSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      setPasswordErrorVisible(true);
      setPasswordError(error.response.data.error);
      setTimeout(() => {
        setPasswordErrorVisible(false);
        setPasswordError("");
      }, 3000);
    }
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>/</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="pl-4 pr-4">
          <span className="text-2xl font-semibold">Settings</span>
          <div className="pt-4">
            <Card className="w-full mb-4 relative">
              <CardHeader>
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-xl font-bold">User</AccordionTrigger>
                    <AccordionContent className="text-sm font-normal">
                      <div className="pb-4">Manage your user settings here. You can change your email, password, and other account settings.</div>
                      <div className="flex flex-col md:flex-row gap-2 mb-2">
                        <div className="w-full">
                          <div className="pb-1 font-semibold text-lg">Change Email</div>
                          { emailErrorVisible && 
                            <div className="pb-2 pt-2">
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                  {emailError}
                                </AlertDescription>
                              </Alert>
                            </div>
                          }
                          { emailSuccess &&
                            <div className="pb-2 pt-2">
                              <Alert>
                                <Check className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>
                                  Email changed successfully.
                                </AlertDescription>
                              </Alert>
                            </div>
                          }
                          <Input 
                            type="email" 
                            placeholder="Enter new email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="mb-2"
                          />
                          <Button
                            onClick={changeEmail}
                            className="w-full"
                          >
                            Change Email
                          </Button>
                        </div>
                        <div className="w-full">
                          <div className="pb-1 font-semibold text-lg">Change Password</div>
                          { passwordErrorVisible &&
                            <div className="pb-2 pt-2">
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                  {passwordError}
                                </AlertDescription>
                              </Alert>
                            </div>
                          }
                          { passwordSuccess &&
                            <div className="pb-2 pt-2">
                              <Alert>
                                <Check className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>
                                  Password changed successfully.
                                </AlertDescription>
                              </Alert>
                            </div>
                          }
                          <Input 
                            type="password" 
                            placeholder="Enter old password" 
                            value={oldPassword} 
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="mb-2"
                          />
                          <Input 
                            type="password" 
                            placeholder="Enter new password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="mb-2"
                          />
                          <Input
                            type="password" 
                            placeholder="Confirm new password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mb-2"
                          />
                          <Button
                            onClick={changePassword}
                            className="w-full"
                          >
                            Change Password
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-xl font-bold">Theme</AccordionTrigger>
                    <AccordionContent className="text-sm font-normal">
                      <div className="pb-1">Select a theme for the application. You can choose between light, dark, or system theme.</div>
                      <Select 
                        value={theme} 
                        onValueChange={(value: string) => setTheme(value)}
                      >
                        <SelectTrigger className="w-full [&_svg]:hidden">
                          <SelectValue>
                            {(theme ?? 'system').charAt(0).toUpperCase() + (theme ?? 'system').slice(1)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardHeader>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}