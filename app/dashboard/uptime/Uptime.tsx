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
import axios from "axios";
import { Card, CardHeader } from "@/components/ui/card";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";

const timeFormats = {
  1: (timestamp: string) => 
    new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
  2: (timestamp: string) => 
    new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
  3: (timestamp: string) => 
    new Date(timestamp).toLocaleDateString([], { 
      day: '2-digit', 
      month: 'short' 
    }),
  4: (timestamp: string) => 
    new Date(timestamp).toLocaleDateString([], { 
      day: '2-digit', 
      month: 'short' 
    })
};

const minBoxWidths = {
  1: 20,
  2: 20,
  3: 24,
  4: 24
};

interface UptimeData {
  appName: string;
  appId: number;
  uptimeSummary: {
    timestamp: string;
    missing: boolean;
    online: boolean | null;
  }[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function Uptime() {
  const [data, setData] = useState<UptimeData[]>([]);
  const [timespan, setTimespan] = useState<1 | 2 | 3 | 4>(1);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const getData = async (selectedTimespan: number, page: number) => {
    setIsLoading(true);
    try {
      const response = await axios.post<{
        data: UptimeData[];
        pagination: PaginationData;
      }>("/api/applications/uptime", { 
        timespan: selectedTimespan,
        page
      });
      
      setData(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error:", error);
      setData([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    const newPage = Math.max(1, pagination.currentPage - 1);
    setPagination(prev => ({...prev, currentPage: newPage}));
    getData(timespan, newPage);
  };

  const handleNext = () => {
    const newPage = Math.min(pagination.totalPages, pagination.currentPage + 1);
    setPagination(prev => ({...prev, currentPage: newPage}));
    getData(timespan, newPage);
  };

  useEffect(() => {
    getData(timespan, 1);
  }, [timespan]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                  <BreadcrumbPage>My Infrastructure</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Uptime</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">Uptime</span>
            <Select 
              value={String(timespan)} 
              onValueChange={(v) => {
                setTimespan(Number(v) as 1 | 2 | 3 | 4);
                setPagination(prev => ({...prev, currentPage: 1}));
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timespan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 hour</SelectItem>
                <SelectItem value="2">Last 1 day</SelectItem>
                <SelectItem value="3">Last 7 days</SelectItem>
                <SelectItem value="4">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              data.map((app) => {
                const reversedSummary = [...app.uptimeSummary].reverse();
                const startTime = reversedSummary[0]?.timestamp;
                const endTime = reversedSummary[reversedSummary.length - 1]?.timestamp;

                return (
                  <Card key={app.appId}>
                    <CardHeader>
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">{app.appName}</span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{startTime ? timeFormats[timespan](startTime) : ""}</span>
                            <span>{endTime ? timeFormats[timespan](endTime) : ""}</span>
                          </div>
                          
                          <Tooltip.Provider>
                            <div 
                              className="grid gap-0.5 w-full pb-2"
                              style={{ 
                                gridTemplateColumns: `repeat(auto-fit, minmax(${minBoxWidths[timespan]}px, 1fr))`
                              }}
                            >
                              {reversedSummary.map((entry) => (
                                <Tooltip.Root key={entry.timestamp}>
                                  <Tooltip.Trigger asChild>
                                    <div
                                      className={`h-8 w-full rounded-sm border transition-colors ${
                                        entry.missing
                                          ? "bg-gray-300 border-gray-400"
                                          : entry.online
                                          ? "bg-green-500 border-green-600"
                                          : "bg-red-500 border-red-600"
                                      }`}
                                    />
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content
                                      className="rounded bg-gray-900 px-2 py-1 text-white text-xs shadow-lg"
                                      side="top"
                                    >
                                      <div className="flex flex-col gap-1">
                                        <p className="font-medium">
                                          {new Date(entry.timestamp).toLocaleString([], {
                                            year: 'numeric',
                                            month: 'short',
                                            day: timespan > 2 ? 'numeric' : undefined,
                                            hour: '2-digit',
                                            minute: timespan === 1 ? '2-digit' : undefined,
                                            hour12: false
                                          })}
                                        </p>
                                        <p>
                                          {entry.missing
                                            ? "No data"
                                            : entry.online
                                            ? "Online"
                                            : "Offline"}
                                        </p>
                                      </div>
                                      <Tooltip.Arrow className="fill-gray-900" />
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              ))}
                            </div>
                          </Tooltip.Provider>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })
            )}
          </div>

          {pagination.totalItems > 0 && !isLoading && (
            <div className="pt-4 pb-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={handlePrevious}
                      aria-disabled={pagination.currentPage === 1 || isLoading}
                      className={
                        pagination.currentPage === 1 || isLoading 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{pagination.currentPage}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={handleNext}
                      aria-disabled={pagination.currentPage === pagination.totalPages || isLoading}
                      className={
                        pagination.currentPage === pagination.totalPages || isLoading 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}