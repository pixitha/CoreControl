import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
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
import { useEffect, useState } from "react";
import axios from "axios"; // Korrekter Import
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Layers, Network, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatsResponse {
  serverCount: number;
  applicationCount: number;
  onlineApplicationsCount: number;
}
import Link from "next/link";


export default function Dashboard() {
  const [serverCount, setServerCount] = useState<number>(0);
  const [applicationCount, setApplicationCount] = useState<number>(0);
  const [onlineApplicationsCount, setOnlineApplicationsCount] = useState<number>(0);

  const getStats = async () => {
    try {
      const response = await axios.post<StatsResponse>('/api/dashboard/get', {});
      setServerCount(response.data.serverCount);
      setApplicationCount(response.data.applicationCount);
      setOnlineApplicationsCount(response.data.onlineApplicationsCount);
    } catch (error: any) {
      console.log("Axios error:", error.response?.data);
    }
  };

  useEffect(() => {
    getStats();
  }, []);

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
                  <BreadcrumbPage>
                    /
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="pl-4 pr-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 pl-4 pr-4 pt-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-rpb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Servers</CardTitle>
                  <Server className="h-5 w-5 text-slate-500" />
                </div>
                <CardDescription>Manage your server infrastructure</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{serverCount}</div>
                <p className="text-xs text-muted-foreground">Active servers</p>
              </CardContent>
              <CardFooter className="border-t p-3">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/servers">View all servers</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-rpb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Applications</CardTitle>
                  <Layers className="h-5 w-5 text-slate-500" />
                </div>
                <CardDescription>Manage your deployed applications</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{applicationCount}</div>
                <p className="text-xs text-muted-foreground">Running applications</p>
              </CardContent>
              <CardFooter className="border-t p-3">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/applications">View all applications</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Uptime</CardTitle>
                  <Activity className="h-5 w-5 text-slate-500" />
                </div>
                <CardDescription>Monitor your service availability</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{onlineApplicationsCount}/{applicationCount}</div>
                <p className="text-xs text-muted-foreground">online Applications</p>
              </CardContent>
              <CardFooter className="border-t p-3">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/uptime">View uptime metrics</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-rpb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Network</CardTitle>
                  <Network className="h-5 w-5 text-slate-500" />
                </div>
                <CardDescription>Manage network configuration</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{serverCount + applicationCount}</div>
                <p className="text-xs text-muted-foreground">Active connections</p>
              </CardContent>
              <CardFooter className="border-t p-3">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/network">View network details</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
