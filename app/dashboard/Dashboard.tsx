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
import { Card, CardHeader } from "@/components/ui/card";

interface StatsResponse {
  serverCount: number;
  applicationCount: number;
  onlineApplicationsCount: number;
}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="w-full mb-4 relative">
              <CardHeader>
                <div className="flex items-center justify-center w-full">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{serverCount}</span>
                    <span className="text-md">Servers</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="w-full mb-4 relative">
              <CardHeader>
                <div className="flex items-center justify-center w-full">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{applicationCount}</span>
                    <span className="text-md">Applications</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="w-full mb-4 relative">
              <CardHeader>
                <div className="flex items-center justify-center w-full">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">
                      {onlineApplicationsCount}/{applicationCount}
                    </span>
                    <span className="text-md">Applications are online</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
          <div className="h-72 w-full rounded-xl flex items-center justify-center bg-muted">
            <span className="text-gray-400 text-2xl">COMING SOON</span>
          </div>
          <div className="pt-4">
            <div className="h-72 w-full rounded-xl flex items-center justify-center bg-muted">
              <span className="text-gray-400 text-2xl">COMING SOON</span>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}