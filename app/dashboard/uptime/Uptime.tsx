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

const timeFormats = {
  1: (timestamp: string) => 
    new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
  2: (timestamp: string) => {
    const start = new Date(timestamp);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    return `${start.toLocaleDateString([], { day: '2-digit', month: 'short' })} 
      ${start.getHours().toString().padStart(2, '0')}:00 - 
      ${end.getHours().toString().padStart(2, '0')}:00`;
  },
  3: (timestamp: string) => 
    new Date(timestamp).toLocaleDateString([], { 
      day: '2-digit', 
      month: 'short' 
    })
};

const gridColumns = {
  1: 30,
  2: 56,
  3: 30
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
  
export default function Uptime() {
    const [data, setData] = useState<UptimeData[]>([]);
    const [timespan, setTimespan] = useState<1 | 2 | 3>(1);

    const getData = async (selectedTimespan: number) => {
        try {
          const response = await axios.post<UptimeData[]>("/api/applications/uptime", { 
            timespan: selectedTimespan 
          });
          setData(response.data);
        } catch (error) {
          console.error("Error:", error);
          setData([]); // Setze leeres Array bei Fehlern
        }
      };

  useEffect(() => {
    getData(timespan);
  }, [timespan]);

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
        <div className="pl-4 pr-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-semibold">Uptime</span>
            <Select 
              value={String(timespan)} 
              onValueChange={(v) => setTimespan(Number(v) as 1 | 2 | 3)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timespan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 30 minutes</SelectItem>
                <SelectItem value="2">Last 7 days</SelectItem>
                <SelectItem value="3">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-4 space-y-4 pb-4">
            {data.map((app) => {
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
                            className="grid gap-0.5 w-full overflow-x-auto pb-2"
                            style={{ 
                              gridTemplateColumns: `repeat(${gridColumns[timespan]}, minmax(0, 1fr))`,
                              minWidth: `${gridColumns[timespan] * 24}px`
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
                                        {timespan === 2 ? (
                                          timeFormats[2](entry.timestamp)
                                        ) : (
                                          new Date(entry.timestamp).toLocaleString([], {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: timespan === 3 ? undefined : '2-digit',
                                            hour12: false
                                          })
                                        )}
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
            })}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}