"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Link from "next/link"
import { Activity, Layers, Network, Server } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface StatsResponse {
  serverCountNoVMs: number
  serverCountOnlyVMs: number
  applicationCount: number
  onlineApplicationsCount: number
}

export default function Dashboard() {
  const [serverCountNoVMs, setServerCountNoVMs] = useState<number>(0)
  const [serverCountOnlyVMs, setServerCountOnlyVMs] = useState<number>(0)
  const [applicationCount, setApplicationCount] = useState<number>(0)
  const [onlineApplicationsCount, setOnlineApplicationsCount] = useState<number>(0)

  const getStats = async () => {
    try {
      const response = await axios.post<StatsResponse>("/api/dashboard/get", {})
      setServerCountNoVMs(response.data.serverCountNoVMs)
      setServerCountOnlyVMs(response.data.serverCountOnlyVMs)
      setApplicationCount(response.data.applicationCount)
      setOnlineApplicationsCount(response.data.onlineApplicationsCount)
    } catch (error: any) {
      console.log("Axios error:", error.response?.data)
    }
  }

  useEffect(() => {
    getStats()
  }, [])

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
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-6">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card className="overflow-hidden border-t-4 border-t-rose-500 shadow-lg transition-all hover:shadow-xl hover:border-t-rose-600">
              <CardHeader className="py-3 pb-1">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold">Servers</CardTitle>
                    <CardDescription className="mt-1">Physical and virtual servers overview</CardDescription>
                  </div>
                  <Server className="h-8 w-8 text-rose-500 p-1.5 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="pt-1 pb-2 min-h-[120px]">
                <div className="grid grid-cols-2 gap-4">
                  {/* Physical Servers */}
                  <div className="flex items-center space-x-4 border border-gray-background p-4 rounded-lg">
                    <div className="bg-rose-100 p-2 rounded-full">
                      <Server className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{serverCountNoVMs}</div>
                      <p className="text-sm text-muted-foreground">Physical Servers</p>
                    </div>
                  </div>

                  {/* Virtual Machines */}
                  <div className="flex items-center space-x-4 border border-gray-background p-4 rounded-lg">
                    <div className="bg-violet-100 p-2 rounded-full">
                      <Network className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{serverCountOnlyVMs}</div>
                      <p className="text-sm text-muted-foreground">Virtual Servers</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 py-2 px-4">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full font-semibold transition-colors border border-muted-foreground/20 hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/dashboard/servers" className="flex items-center justify-between">
                    <span>Manage Servers</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden border-t-4 border-t-amber-500 shadow-lg transition-all hover:shadow-xl hover:border-t-amber-600">
              <CardHeader className="py-3 pb-1">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold">Applications</CardTitle>
                    <CardDescription className="mt-1">Manage your deployed applications</CardDescription>
                  </div>
                  <Layers className="h-8 w-8 text-amber-500 p-1.5 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="pt-1 pb-2 min-h-[120px]">
                <div className="text-4xl font-bold">{applicationCount}</div>
                <p className="text-sm text-muted-foreground mt-2">Running applications</p>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 py-2 px-4">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full font-semibold transition-colors border border-muted-foreground/20 hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/dashboard/applications" className="flex items-center justify-between">
                    <span>View all applications</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden border-t-4 border-t-emerald-500 shadow-lg transition-all hover:shadow-xl hover:border-t-emerald-600">
              <CardHeader className="py-3 pb-1">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold">Uptime</CardTitle>
                    <CardDescription className="mt-1">Monitor your service availability</CardDescription>
                  </div>
                  <Activity className="h-8 w-8 text-emerald-500 p-1.5 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="pt-1 pb-2 min-h-[120px]">
                <div className="flex flex-col">
                  <div className="text-4xl font-bold flex items-center justify-between">
                    <span>
                      {onlineApplicationsCount}/{applicationCount}
                    </span>
                    <div className="flex items-center bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-lg font-semibold">
                      {applicationCount > 0 ? Math.round((onlineApplicationsCount / applicationCount) * 100) : 0}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full"
                      style={{
                        width: `${applicationCount > 0 ? Math.round((onlineApplicationsCount / applicationCount) * 100) : 0}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Online applications</p>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 py-2 px-4">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full font-semibold transition-colors border border-muted-foreground/20 hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/dashboard/uptime" className="flex items-center justify-between">
                    <span>View uptime metrics</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden border-t-4 border-t-sky-500 shadow-lg transition-all hover:shadow-xl hover:border-t-sky-600">
              <CardHeader className="py-3 pb-1">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold">Network</CardTitle>
                    <CardDescription className="mt-1">Manage network configuration</CardDescription>
                  </div>
                  <Network className="h-8 w-8 text-sky-500 p-1.5 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="pt-1 pb-2 min-h-[120px]">
                <div className="text-4xl font-bold">{serverCountNoVMs + serverCountOnlyVMs + applicationCount}</div>
                <p className="text-sm text-muted-foreground mt-2">Active connections</p>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 py-2 px-4">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full font-semibold transition-colors border border-muted-foreground/20 hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/dashboard/network" className="flex items-center justify-between">
                    <span>View network details</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
