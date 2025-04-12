"use client";

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
import { Button } from "@/components/ui/button";
import { Plus, Link, Home, Trash2, LayoutGrid, List } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import axios from 'axios';

export default function Dashboard() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [publicURL, setPublicURL] = useState("");
  const [localURL, setLocalURL] = useState("");
  const [serverId, setServerId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [applications, setApplications] = useState([]);
  const [servers, setServers] = useState([]);
  const [isGridLayout, setIsGridLayout] = useState(false);

  useEffect(() => {
    const savedLayout = Cookies.get('layoutPreference');
    const layout_bool = savedLayout === 'grid'
    setIsGridLayout(layout_bool);
    setItemsPerPage(layout_bool ? 15 : 5)
  }, []);

  const toggleLayout = () => {
    const newLayout = !isGridLayout;
    setIsGridLayout(newLayout);
    Cookies.set('layoutPreference', newLayout ? 'grid' : 'standard', {
      expires: 365,
      path: '/',
      sameSite: 'strict'
    });
    setItemsPerPage(newLayout ? 15 : 5);
  };

  const add = async () => {
    try {
      await axios.post('/api/applications/add', { 
        name, 
        description, 
        icon, 
        publicURL, 
        localURL,
        serverId 
      });
      getApplications();
    } catch (error: any) {
      console.log(error.response.data);
    }
  }

  const getApplications = async () => {
    try {
      const response = await axios.post('/api/applications/get', { page: currentPage, ITEMS_PER_PAGE: itemsPerPage });
      setApplications(response.data.applications);
      setServers(response.data.servers);
      setMaxPage(response.data.maxPage);
    } catch (error: any) {
      console.log(error.response);
    }
  }

  useEffect(() => {
    getApplications();
  }, [currentPage, itemsPerPage]);

  const handlePrevious = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNext = () => setCurrentPage(prev => Math.min(maxPage, prev + 1));

  const deleteApplication = async (id: number) => {
    try {
      await axios.post('/api/applications/delete', { id });
      getApplications();
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
                  <BreadcrumbPage>Applications</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="pl-4 pr-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-semibold">Your Applications</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleLayout}
                title={isGridLayout ? "Switch to list view" : "Switch to grid view"}
              >
                {isGridLayout ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </Button>
              {servers.length === 0 ? (
                <p className="text-muted-foreground">You must first add a server.</p>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Add an application</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-4 pt-4">
                        <div className="grid w-full items-center gap-1.5">
                          <Label>Name</Label>
                          <Input placeholder="e.g. Portainer" onChange={(e) => setName(e.target.value)}/>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label>Server</Label>
                          <Select onValueChange={(v) => setServerId(Number(v))} required>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select server" />
                            </SelectTrigger>
                            <SelectContent>
                              {servers.map((server) => (
                                <SelectItem key={server.id} value={String(server.id)}>
                                  {server.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label>Description <span className="text-stone-600">(optional)</span></Label>
                          <Textarea placeholder="Application description" onChange={(e) => setDescription(e.target.value)}/>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label>Icon URL <span className="text-stone-600">(optional)</span></Label>
                          <Input placeholder="https://example.com/icon.png" onChange={(e) => setIcon(e.target.value)}/>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label>Public URL</Label>
                          <Input placeholder="https://example.com" onChange={(e) => setPublicURL(e.target.value)}/>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label>Local URL <span className="text-stone-600">(optional)</span></Label>
                          <Input placeholder="http://localhost:3000" onChange={(e) => setLocalURL(e.target.value)}/>
                        </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button onClick={add} disabled={!name || !publicURL || !serverId}>
                        Add
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
          </div>
          </div>
          <br />
          <div className={isGridLayout ? 
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : 
            "space-y-4"}>
            {applications.map((app) => (
              <Card 
              key={app.id} 
              className={isGridLayout ? "h-full flex flex-col justify-between relative" : "w-full mb-4 relative"}
            >
              <CardHeader>
                {/* Online-/Offline-Indikator mit innerem Kreis */}
                <div className="absolute top-2 right-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${app.online ? "bg-green-700" : "bg-red-700"}`}
                    title={app.online ? "Online" : "Offline"}
                  >
                    <div className={`w-2 h-2 rounded-full ${app.online ? "bg-green-500" : "bg-red-500"}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-md">
                      {app.icon ? (
                        <img src={app.icon} alt={app.name} className="w-full h-full object-contain rounded-md" />
                      ) : (
                        <span className="text-gray-500 text-xs">Image</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <CardTitle className="text-2xl font-bold">{app.name}</CardTitle>
                      <CardDescription className="text-md">
                        {app.description}<br />
                        Server: {app.server || 'No server'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-start space-y-2 w-[270px]">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex flex-col space-y-2 flex-grow">
                        <Button 
                          variant="outline" 
                          className="gap-2 w-full"
                          onClick={() => window.open(app.publicURL, "_blank")}
                        >
                          <Link className="h-4 w-4" />
                          Open Public URL
                        </Button>
                        {app.localURL && (
                          <Button 
                            variant="outline" 
                            className="gap-2 w-full"
                            onClick={() => window.open(app.localURL, "_blank")}
                          >
                            <Home className="h-4 w-4" />
                            Open Local URL
                          </Button>
                        )}
                      </div>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        className="h-[72px] w-10"
                        onClick={() => deleteApplication(app.id)}
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