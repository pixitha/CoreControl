"use client";

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, Link, MonitorCog, FileDigit, Trash2, LayoutGrid, List } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import axios from 'axios';

export default function Dashboard() {
  const [name, setName] = useState("");
  const [os, setOs] = useState("");
  const [ip, setIp] = useState("");
  const [url, setUrl] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [servers, setServers] = useState([]);
  const [isGridLayout, setIsGridLayout] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLayout = Cookies.get('layoutPreference');
    setIsGridLayout(savedLayout === 'grid');
  }, []);

  const toggleLayout = () => {
    const newLayout = !isGridLayout;
    setIsGridLayout(newLayout);
    Cookies.set('layoutPreference', newLayout ? 'grid' : 'standard', {
      expires: 365,
      path: '/',
      sameSite: 'strict'
    });
  };

  const add = async () => {
    try {
      const response = await axios.post('/api/servers/add', { name, os, ip, url });
      getServers();
    } catch (error: any) {
      console.log(error.response.data);
    }
  }

  const getServers = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/servers/get', { page: currentPage });
      setServers(response.data.servers);
      setMaxPage(response.data.maxPage);
      setLoading(false);
    } catch (error: any) {
      console.log(error.response);
    }
  }

  useEffect(() => {
    getServers();
  }, [currentPage]);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }

  const handleNext = () => {
    setCurrentPage(prev => Math.min(maxPage, prev + 1));
  }

  const deleteApplication = async (id: number) => {
    try {
      await axios.post('/api/servers/delete', { id });
      getServers();
    } catch (error: any) {
      console.log(error.response.data);
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
                  <BreadcrumbPage>My Infrastructure</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Servers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="pl-4 pr-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-semibold">Your Servers</span>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={toggleLayout}
                    >
                      {isGridLayout ? (
                        <List className="h-4 w-4" />
                      ) : (
                        <LayoutGrid className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isGridLayout ? 
                      "Switch to list view" : 
                      "Switch to grid view"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Add an server</AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-4 pt-4">
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" type="text" placeholder="e.g. Server1" onChange={(e) => setName(e.target.value)}/>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="description">Operating System <span className="text-stone-600">(optional)</span></Label>
                          <Select onValueChange={(value) => setOs(value)}>
                              <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select OS" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Windows">Windows</SelectItem>
                                  <SelectItem value="Linux">Linux</SelectItem>
                                  <SelectItem value="MacOS">MacOS</SelectItem>
                              </SelectContent>
                          </Select>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="icon">IP Adress <span className="text-stone-600">(optional)</span></Label>
                          <Input id="icon" type="text" placeholder="e.g. 192.168.100.2" onChange={(e) => setIp(e.target.value)}/>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger>
                                      <Label htmlFor="publicURL">Management URL <span className="text-stone-600">(optional)</span></Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                  Link to a web interface (e.g. Proxmox or Portainer) with which the server can be managed
                                  </TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                          <Input id="publicURL" type="text" placeholder="e.g. https://proxmox.server1.com" onChange={(e) => setUrl(e.target.value)}/>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button onClick={add}>Add</Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <br />
          {!loading ?
            <div className={isGridLayout ? 
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : 
              "space-y-4"}>
              {servers.map((server) => (
                <Card 
                  key={server.id} 
                  className={isGridLayout ? 
                    "h-full flex flex-col justify-between" : 
                    "w-full mb-4"}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                      <div className="ml-4">
                        <CardTitle className="text-2xl font-bold">{server.name}</CardTitle>
                        <CardDescription className="text-sm space-y-1 mt-1">
                            <div className="flex items-center gap-2 text-foreground/80">
                            <MonitorCog className="h-4 w-4 text-muted-foreground" />
                            <span>OS: {server.os || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground/80">
                            <FileDigit className="h-4 w-4 text-muted-foreground" />
                            <span>IP: {server.ip || 'Nicht angegeben'}</span>
                            </div>
                        </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-start space-y-2 w-[270px]">
                        <div className="flex items-center gap-2 w-full">
                        <div className="flex flex-col space-y-2 flex-grow">
                            {server.url && (
                                <Button 
                                variant="outline" 
                                className="gap-2 w-full"
                                onClick={() => window.open(server.url, "_blank")}
                                >
                                <Link className="h-4 w-4" />
                                Open Management URL
                                </Button>
                            )}
                            </div>
                        <Button 
                            variant="destructive" 
                            size="icon"
                            className="w-10"
                            onClick={() => deleteApplication(server.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          : 
            <div className="flex items-center justify-center">
                  <div className='inline-block' role='status' aria-label='loading'>
                  <svg className='w-6 h-6 stroke-white animate-spin ' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <g clip-path='url(#clip0_9023_61563)'>
                      <path d='M14.6437 2.05426C11.9803 1.2966 9.01686 1.64245 6.50315 3.25548C1.85499 6.23817 0.504864 12.4242 3.48756 17.0724C6.47025 21.7205 12.6563 23.0706 17.3044 20.088C20.4971 18.0393 22.1338 14.4793 21.8792 10.9444' stroke='stroke-current' stroke-width='1.4' stroke-linecap='round' class='my-path'></path>
                  </g>
                  <defs>
                      <clipPath id='clip0_9023_61563'>
                      <rect width='24' height='24' fill='white'></rect>
                      </clipPath>
                  </defs>
                  </svg>
                  <span className='sr-only'>Loading...</span>
                  </div>
              </div>
          }
          <div className="pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={handlePrevious}
                    isActive={currentPage > 1}
                  />
                </PaginationItem>
                
                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={handleNext}
                    isActive={currentPage < maxPage}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}