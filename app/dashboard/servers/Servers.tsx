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
import { Plus, Link, MonitorCog, FileDigit, Trash2, LayoutGrid, List, Pencil, Cpu, Microchip, MemoryStick, HardDrive } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Dashboard() {
  const [name, setName] = useState("");
  const [os, setOs] = useState("");
  const [ip, setIp] = useState("");
  const [url, setUrl] = useState("");
  const [cpu, setCpu] = useState("");
  const [gpu, setGpu] = useState("");
  const [ram, setRam] = useState("");
  const [disk, setDisk] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [servers, setServers] = useState([]);
  const [isGridLayout, setIsGridLayout] = useState(false);
  const [loading, setLoading] = useState(true);


  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editOs, setEditOs] = useState("");
  const [editIp, setEditIp] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCpu, setEditCpu] = useState("");
  const [editGpu, setEditGpu] = useState("");
  const [editRam, setEditRam] = useState("");
  const [editDisk, setEditDisk] = useState("");

  
  useEffect(() => {
    const savedLayout = Cookies.get('layoutPreference-servers');
    setIsGridLayout(savedLayout === 'grid');
  }, []);

  const toggleLayout = () => {
    const newLayout = !isGridLayout;
    setIsGridLayout(newLayout);
    Cookies.set('layoutPreference-servers', newLayout ? 'grid' : 'standard', {
      expires: 365,
      path: '/',
      sameSite: 'strict'
    });
  };

  const add = async () => {
    try {
      const response = await axios.post('/api/servers/add', { name, os, ip, url, cpu, gpu, ram, disk });
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
      console.log(response.data.servers)
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

  const openEditDialog = (server: any) => {
    setEditId(server.id);
    setEditName(server.name);
    setEditOs(server.os);
    setEditIp(server.ip);
    setEditUrl(server.url);
    setEditCpu(server.cpu);
    setEditGpu(server.gpu);
    setEditRam(server.ram);
    setEditDisk(server.disk);
  };

  const edit = async () => {
    try {
      await axios.put('/api/servers/edit', { 
        id: editId,
        name: editName,
        os: editOs,
        ip: editIp,
        url: editUrl,
        cpu: editCpu,
        gpu: editGpu,
        ram: editRam,
        disk: editDisk
      });
      getServers();
      setEditId(null);
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
                    <Tabs defaultValue="general" className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="hardware">Hardware</TabsTrigger>
                      </TabsList>
                      <TabsContent value="general">
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
                      </TabsContent>
                      <TabsContent value="hardware">
                        <div className="space-y-4 pt-4">
                          <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="name">CPU <span className="text-stone-600">(optional)</span></Label>
                            <Input id="name" type="text" placeholder="e.g. AMD Ryzen™ 7 7800X3D" onChange={(e) => setCpu(e.target.value)}/>
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">GPU <span className="text-stone-600">(optional)</span></Label>
                              <Input id="name" type="text" placeholder="e.g. AMD Radeon™ Graphics" onChange={(e) => setGpu(e.target.value)}/>
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">RAM <span className="text-stone-600">(optional)</span></Label>
                              <Input id="name" type="text" placeholder="e.g. 64GB DDR5" onChange={(e) => setRam(e.target.value)}/>
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">Disk <span className="text-stone-600">(optional)</span></Label>
                              <Input id="name" type="text" placeholder="e.g. 2TB SSD" onChange={(e) => setDisk(e.target.value)}/>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={add}>Add</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <br />
          {!loading ?
            <div className={isGridLayout ? 
              "grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4" : 
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
                          <CardDescription className={`text-sm mt-1 grid gap-y-1 ${isGridLayout ? "grid-cols-1" : "grid-cols-2 gap-x-4"}`}>
                            <div className="flex items-center gap-2 text-foreground/80">
                              <MonitorCog className="h-4 w-4 text-muted-foreground" />
                              <span><b>OS:</b> {server.os || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground/80">
                              <FileDigit className="h-4 w-4 text-muted-foreground" />
                              <span><b>IP:</b> {server.ip || 'Nicht angegeben'}</span>
                            </div>

                            <div className="col-span-full pt-2 pb-2">
                              <Separator />
                            </div>

                            <div className="flex items-center gap-2 text-foreground/80">
                              <Cpu className="h-4 w-4 text-muted-foreground" />
                              <span><b>CPU:</b> {server.cpu || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground/80">
                              <Microchip className="h-4 w-4 text-muted-foreground" />
                              <span><b>GPU:</b> {server.gpu || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground/80">
                              <MemoryStick className="h-4 w-4 text-muted-foreground" />
                              <span><b>RAM:</b> {server.ram || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground/80">
                              <HardDrive className="h-4 w-4 text-muted-foreground" />
                              <span><b>Disk:</b> {server.disk || '-'}</span>
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-start space-y-2 w-[405px]">
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="icon"
                                className="w-10"
                                onClick={() => openEditDialog(server)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Edit Server</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="w-full">
                                      <TabsTrigger value="general">General</TabsTrigger>
                                      <TabsTrigger value="hardware">Hardware</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="general">
                                      <div className="space-y-4 pt-4">
                                    <div className="grid w-full items-center gap-1.5">
                                      <Label htmlFor="editOs">Operating System</Label>
                                      <Select 
                                        value={editOs} 
                                        onValueChange={setEditOs}
                                      >
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
                                      <Label htmlFor="editIp">IP Adress</Label>
                                      <Input 
                                        id="editIp" 
                                        type="text" 
                                        placeholder="e.g. 192.168.100.2"
                                        value={editIp}
                                        onChange={(e) => setEditIp(e.target.value)}
                                      />
                                    </div>
                                    <div className="grid w-full items-center gap-1.5">
                                      <Label htmlFor="editUrl">Management URL</Label>
                                      <Input 
                                        id="editUrl" 
                                        type="text" 
                                        placeholder="e.g. https://proxmox.server1.com"
                                        value={editUrl}
                                        onChange={(e) => setEditUrl(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </TabsContent>

                                <TabsContent value="hardware">
          <div className="space-y-4 pt-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="editCpu">CPU</Label>
              <Input 
                id="editCpu" 
                value={editCpu}
                onChange={(e) => setEditCpu(e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="editGpu">GPU</Label>
              <Input 
                id="editGpu" 
                value={editGpu}
                onChange={(e) => setEditGpu(e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="editRam">RAM</Label>
              <Input 
                id="editRam" 
                value={editRam}
                onChange={(e) => setEditRam(e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="editDisk">Disk</Label>
              <Input 
                id="editDisk" 
                value={editDisk}
                onChange={(e) => setEditDisk(e.target.value)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <Button onClick={edit}>Save</Button>
  </AlertDialogFooter>
</AlertDialogContent>
                          </AlertDialog>
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