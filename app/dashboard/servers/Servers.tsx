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
import {
  Plus,
  Link,
  MonitorCog,
  FileDigit,
  Trash2,
  LayoutGrid,
  List,
  Pencil,
  Cpu,
  Microchip,
  MemoryStick,
  HardDrive,
  Server,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Server {
  id: number;
  name: string;
  host: boolean;
  hostServer: number | null;
  os?: string;
  ip?: string;
  url?: string;
  cpu?: string;
  gpu?: string;
  ram?: string;
  disk?: string;
  hostedVMs: Server[];
}

interface GetServersResponse {
  servers: Server[];
  maxPage: number;
}

export default function Dashboard() {
  const [host, setHost] = useState<boolean>(false);
  const [hostServer, setHostServer] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [os, setOs] = useState<string>("");
  const [ip, setIp] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [cpu, setCpu] = useState<string>("");
  const [gpu, setGpu] = useState<string>("");
  const [ram, setRam] = useState<string>("");
  const [disk, setDisk] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [maxPage, setMaxPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(4);
  const [servers, setServers] = useState<Server[]>([]);
  const [isGridLayout, setIsGridLayout] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [editId, setEditId] = useState<number | null>(null);
  const [editHost, setEditHost] = useState<boolean>(false);
  const [editHostServer, setEditHostServer] = useState<number | null>(0);
  const [editName, setEditName] = useState<string>("");
  const [editOs, setEditOs] = useState<string>("");
  const [editIp, setEditIp] = useState<string>("");
  const [editUrl, setEditUrl] = useState<string>("");
  const [editCpu, setEditCpu] = useState<string>("");
  const [editGpu, setEditGpu] = useState<string>("");
  const [editRam, setEditRam] = useState<string>("");
  const [editDisk, setEditDisk] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [hostServers, setHostServers] = useState<Server[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const savedLayout = Cookies.get("layoutPreference-servers");
    const layout_bool = savedLayout === "grid";
    setIsGridLayout(layout_bool);
    setItemsPerPage(layout_bool ? 6 : 4);
  }, []);

  const toggleLayout = () => {
    const newLayout = !isGridLayout;
    setIsGridLayout(newLayout);
    Cookies.set("layoutPreference-servers", newLayout ? "grid" : "standard", {
      expires: 365,
      path: "/",
      sameSite: "strict",
    });
    setItemsPerPage(newLayout ? 6 : 4);
  };

  const add = async () => {
    try {
      await axios.post("/api/servers/add", {
        host,
        hostServer,
        name,
        os,
        ip,
        url,
        cpu,
        gpu,
        ram,
        disk,
      });
      setIsAddDialogOpen(false);
      setHost(false);
      setHostServer(0);

      setName("");
      setOs("");
      setIp("");
      setUrl("");
      setCpu("");
      setGpu("");
      setRam("");
      setDisk("");
      getServers();
    } catch (error: any) {
      console.log(error.response.data);
    }
  };

  const getServers = async () => {
    try {
      setLoading(true);
      const response = await axios.post<GetServersResponse>(
        "/api/servers/get",
        {
          page: currentPage,
          ITEMS_PER_PAGE: itemsPerPage,
        }
      );
      for (const server of response.data.servers) {
        console.log("Host Server:" + server.hostServer);
        console.log("ID:" + server.id);
      }
      setServers(response.data.servers);
      setMaxPage(response.data.maxPage);
      setLoading(false);
    } catch (error: any) {
      console.log(error.response);
    }
  };

  useEffect(() => {
    getServers();
  }, [currentPage, itemsPerPage]);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(maxPage, prev + 1));
  };

  const deleteApplication = async (id: number) => {
    try {
      await axios.post("/api/servers/delete", { id });
      getServers();
    } catch (error: any) {
      console.log(error.response.data);
    }
  };

  const openEditDialog = (server: Server) => {
    setEditId(server.id);
    setEditHost(server.host);
    setEditHostServer(server.hostServer || null);
    setEditName(server.name);
    setEditOs(server.os || "");
    setEditIp(server.ip || "");
    setEditUrl(server.url || "");
    setEditCpu(server.cpu || "");
    setEditGpu(server.gpu || "");
    setEditRam(server.ram || "");
    setEditDisk(server.disk || "");
  };

  const edit = async () => {
    if (!editId) return;

    try {
      await axios.put("/api/servers/edit", {
        id: editId,
        host: editHost,
        hostServer: editHostServer,
        name: editName,
        os: editOs,
        ip: editIp,
        url: editUrl,
        cpu: editCpu,
        gpu: editGpu,
        ram: editRam,
        disk: editDisk,
      });
      getServers();
      setEditId(null);
    } catch (error: any) {
      console.log(error.response.data);
    }
  };

  const searchServers = async () => {
    try {
      setIsSearching(true);
      const response = await axios.post<{ results: Server[] }>(
        "/api/servers/search",
        { searchterm: searchTerm }
      );
      setServers(response.data.results);
      setIsSearching(false);
    } catch (error: any) {
      console.error("Search error:", error.response?.data);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim() === "") {
        getServers();
      } else {
        searchServers();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  useEffect(() => {
    const fetchHostServers = async () => {
      try {
        const response = await axios.get<{ servers: Server[] }>(
          "/api/servers/hosts"
        );
        setHostServers(response.data.servers);
      } catch (error) {
        console.error("Error fetching host servers:", error);
      }
    };

    if (isAddDialogOpen || editId !== null) {
      fetchHostServers();
    }
  }, [isAddDialogOpen, editId]);

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
                  <BreadcrumbPage>Servers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">Your Servers</span>
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
                    {isGridLayout
                      ? "Switch to list view"
                      : "Switch to grid view"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialog onOpenChange={setIsAddDialogOpen}>
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
                          <TabsTrigger value="virtualization">
                            Virtualization
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                          <div className="space-y-4 pt-4">
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                type="text"
                                placeholder="e.g. Server1"
                                onChange={(e) => setName(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="description">
                                Operating System{" "}
                                <span className="text-stone-600">
                                  (optional)
                                </span>
                              </Label>
                              <Select onValueChange={(value) => setOs(value)}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select OS" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Windows">
                                    Windows
                                  </SelectItem>
                                  <SelectItem value="Linux">Linux</SelectItem>
                                  <SelectItem value="MacOS">MacOS</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="icon">
                                IP Adress{" "}
                                <span className="text-stone-600">
                                  (optional)
                                </span>
                              </Label>
                              <Input
                                id="icon"
                                type="text"
                                placeholder="e.g. 192.168.100.2"
                                onChange={(e) => setIp(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Label htmlFor="publicURL">
                                      Management URL{" "}
                                      <span className="text-stone-600">
                                        (optional)
                                      </span>
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Link to a web interface (e.g. Proxmox or
                                    Portainer) with which the server can be
                                    managed
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Input
                                id="publicURL"
                                type="text"
                                placeholder="e.g. https://proxmox.server1.com"
                                onChange={(e) => setUrl(e.target.value)}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="hardware">
                          <div className="space-y-4 pt-4">
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">
                                CPU{" "}
                                <span className="text-stone-600">
                                  (optional)
                                </span>
                              </Label>
                              <Input
                                id="name"
                                type="text"
                                placeholder="e.g. AMD Ryzen™ 7 7800X3D"
                                onChange={(e) => setCpu(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">
                                GPU{" "}
                                <span className="text-stone-600">
                                  (optional)
                                </span>
                              </Label>
                              <Input
                                id="name"
                                type="text"
                                placeholder="e.g. AMD Radeon™ Graphics"
                                onChange={(e) => setGpu(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">
                                RAM{" "}
                                <span className="text-stone-600">
                                  (optional)
                                </span>
                              </Label>
                              <Input
                                id="name"
                                type="text"
                                placeholder="e.g. 64GB DDR5"
                                onChange={(e) => setRam(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">
                                Disk{" "}
                                <span className="text-stone-600">
                                  (optional)
                                </span>
                              </Label>
                              <Input
                                id="name"
                                type="text"
                                placeholder="e.g. 2TB SSD"
                                onChange={(e) => setDisk(e.target.value)}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="virtualization">
                          <div className="space-y-4 pt-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="hostCheckbox"
                                checked={host}
                                onCheckedChange={(checked) =>
                                  setHost(checked === true)
                                }
                              />
                              <Label htmlFor="hostCheckbox">
                                Mark as host server
                              </Label>
                            </div>
                            {!host && (
                              <div className="grid w-full items-center gap-1.5">
                                <Label>Host Server</Label>
                                <Select
                                  value={hostServer?.toString()}
                                  onValueChange={(value) =>
                                    setHostServer(Number(value))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a host server" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {hostServers.map((server) => (
                                      <SelectItem
                                        key={server.id}
                                        value={server.id.toString()}
                                      >
                                        {server.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
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
          <div className="flex flex-col gap-2 mb-4 pt-2">
            <Input
              id="application-search"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <br />
          {!loading ? (
            <div
              className={
                isGridLayout
                  ? "grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4"
                  : "space-y-4"
              }
            >
              {servers
                .filter((server) => server.hostServer === 0)
                .map((server) => (
                  <Card
                    key={server.id}
                    className={
                      isGridLayout
                        ? "h-full flex flex-col justify-between"
                        : "w-full mb-4"
                    }
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <CardTitle className="text-2xl font-bold">
                              {server.name}
                            </CardTitle>
                            <CardDescription
                              className={`text-sm mt-1 grid gap-y-1 ${
                                isGridLayout
                                  ? "grid-cols-1"
                                  : "grid-cols-2 gap-x-4"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-foreground/80">
                                <MonitorCog className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  <b>OS:</b> {server.os || "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-foreground/80">
                                <FileDigit className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  <b>IP:</b> {server.ip || "Not set"}
                                </span>
                              </div>

                              <div className="col-span-full pt-2 pb-2">
                                <Separator />
                              </div>

                              <div className="flex items-center gap-2 text-foreground/80">
                                <Cpu className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  <b>CPU:</b> {server.cpu || "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-foreground/80">
                                <Microchip className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  <b>GPU:</b> {server.gpu || "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-foreground/80">
                                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  <b>RAM:</b> {server.ram || "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-foreground/80">
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  <b>Disk:</b> {server.disk || "-"}
                                </span>
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
                                  onClick={() =>
                                    window.open(server.url, "_blank")
                                  }
                                >
                                  <Link className="h-4 w-4" />
                                  Open Management URL
                                </Button>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => deleteApplication(server.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => openEditDialog(server)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Edit Server
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      <Tabs
                                        defaultValue="general"
                                        className="w-full"
                                      >
                                        <TabsList className="w-full">
                                          <TabsTrigger value="general">
                                            General
                                          </TabsTrigger>
                                          <TabsTrigger value="hardware">
                                            Hardware
                                          </TabsTrigger>
                                          <TabsTrigger value="virtualization">
                                            Virtualization
                                          </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="general">
                                          <div className="space-y-4 pt-4">
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label htmlFor="editName">
                                                Name
                                              </Label>
                                              <Input
                                                id="editName"
                                                type="text"
                                                placeholder="e.g. Server1"
                                                value={editName}
                                                onChange={(e) =>
                                                  setEditName(e.target.value)
                                                }
                                              />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label htmlFor="editOs">
                                                Operating System
                                              </Label>
                                              <Select
                                                value={editOs}
                                                onValueChange={setEditOs}
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue placeholder="Select OS" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="Windows">
                                                    Windows
                                                  </SelectItem>
                                                  <SelectItem value="Linux">
                                                    Linux
                                                  </SelectItem>
                                                  <SelectItem value="MacOS">
                                                    MacOS
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label htmlFor="editIp">
                                                IP Adress
                                              </Label>
                                              <Input
                                                id="editIp"
                                                type="text"
                                                placeholder="e.g. 192.168.100.2"
                                                value={editIp}
                                                onChange={(e) =>
                                                  setEditIp(e.target.value)
                                                }
                                              />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label htmlFor="editUrl">
                                                Management URL
                                              </Label>
                                              <Input
                                                id="editUrl"
                                                type="text"
                                                placeholder="e.g. https://proxmox.server1.com"
                                                value={editUrl}
                                                onChange={(e) =>
                                                  setEditUrl(e.target.value)
                                                }
                                              />
                                            </div>
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="hardware">
                                          <div className="space-y-4 pt-4">
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label htmlFor="editCpu">
                                                CPU
                                              </Label>
                                              <Input
                                                id="editCpu"
                                                value={editCpu}
                                                onChange={(e) =>
                                                  setEditCpu(e.target.value)
                                                }
                                              />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label htmlFor="editGpu">
                                                GPU
                                              </Label>
                                              <Input
                                                id="editGpu"
                                                value={editGpu}
                                                onChange={(e) =>
                                                  setEditGpu(e.target.value)
                                                }
                                              />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label htmlFor="editRam">
                                                RAM
                                              </Label>
                                              <Input
                                                id="editRam"
                                                value={editRam}
                                                onChange={(e) =>
                                                  setEditRam(e.target.value)
                                                }
                                              />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label htmlFor="editDisk">
                                                Disk
                                              </Label>
                                              <Input
                                                id="editDisk"
                                                value={editDisk}
                                                onChange={(e) =>
                                                  setEditDisk(e.target.value)
                                                }
                                              />
                                            </div>
                                          </div>
                                        </TabsContent>
                                        <TabsContent value="virtualization">
                                          <div className="space-y-4 pt-4">
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id="editHostCheckbox"
                                                checked={editHost}
                                                onCheckedChange={(checked) =>
                                                  setEditHost(checked === true)
                                                }
                                              />
                                              <Label htmlFor="editHostCheckbox">
                                                Mark as host server
                                              </Label>
                                            </div>
                                            {!editHost && (
                                              <div className="grid w-full items-center gap-1.5">
                                                <Label>Host Server</Label>
                                                <Select
                                                  value={editHostServer?.toString()}
                                                  onValueChange={(value) =>
                                                    setEditHostServer(
                                                      Number(value)
                                                    )
                                                  }
                                                >
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select a host server" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {hostServers.map(
                                                      (server) => (
                                                        <SelectItem
                                                          key={server.id}
                                                          value={server.id.toString()}
                                                        >
                                                          {server.name}
                                                        </SelectItem>
                                                      )
                                                    )}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            )}
                                          </div>
                                        </TabsContent>
                                      </Tabs>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <Button onClick={edit}>Save</Button>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              {server.hostedVMs.length > 0 && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                    >
                                      <Server className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Hosted VMs
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {server.host && (
                                          <div className="mt-4">
                                            <ScrollArea className="h-[500px] w-full pr-3">
                                              <div className="space-y-2 mt-2">
                                                {server.hostedVMs?.map(
                                                  (hostedVM) => (
                                                    <div
                                                      key={hostedVM.id}
                                                      className="flex flex-col gap-2 border border-muted py-2 px-4 rounded-md"
                                                    >
                                                      <div className="flex items-center justify-between">
                                                        <div className="text-base font-extrabold">
                                                          {hostedVM.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-foreground/80">
                                                          <Button
                                                            variant="outline"
                                                            className="gap-2"
                                                            onClick={() =>
                                                              window.open(
                                                                hostedVM.url,
                                                                "_blank"
                                                              )
                                                            }
                                                          >
                                                            <Link className="h-4 w-4" />
                                                          </Button>
                                                        <Button
                                                          variant="destructive"
                                                          size="icon"
                                                          className="h-9 w-9"
                                                          onClick={() =>
                                                            deleteApplication(
                                                              hostedVM.id
                                                            )
                                                          }
                                                        >
                                                          <Trash2 className="h-4 w-4" />
                                                        </Button>

                                                        <AlertDialog>
                                                          <AlertDialogTrigger
                                                            asChild
                                                          >
                                                            <Button
                                                              size="icon"
                                                              className="h-9 w-9"
                                                              onClick={() =>
                                                                openEditDialog(
                                                                  hostedVM
                                                                )
                                                              }
                                                            >
                                                              <Pencil className="h-4 w-4" />
                                                            </Button>
                                                          </AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                              <AlertDialogTitle>
                                                                Edit VM
                                                              </AlertDialogTitle>
                                                              <AlertDialogDescription>
                                                                <Tabs
                                                                  defaultValue="general"
                                                                  className="w-full"
                                                                >
                                                                  <TabsList className="w-full">
                                                                    <TabsTrigger value="general">
                                                                      General
                                                                    </TabsTrigger>
                                                                    <TabsTrigger value="hardware">
                                                                      Hardware
                                                                    </TabsTrigger>
                                                                    <TabsTrigger value="virtualization">
                                                                      Virtualization
                                                                    </TabsTrigger>
                                                                  </TabsList>
                                                                  <TabsContent value="general">
                                                                    <div className="space-y-4 pt-4">
                                                                      <div className="grid w-full items-center gap-1.5">
                                                                        <Label htmlFor="editName">
                                                                          Name
                                                                        </Label>
                                                                        <Input
                                                                          id="editName"
                                                                          type="text"
                                                                          placeholder="e.g. Server1"
                                                                          value={
                                                                            editName
                                                                          }
                                                                          onChange={(
                                                                            e
                                                                          ) =>
                                                                            setEditName(
                                                                              e
                                                                                .target
                                                                                .value
                                                                            )
                                                                          }
                                                                        />
                                                                      </div>
                                                                      <div className="grid w-full items-center gap-1.5">
                                                                        <Label htmlFor="editOs">
                                                                          Operating
                                                                          System
                                                                        </Label>
                                                                        <Select
                                                                          value={
                                                                            editOs
                                                                          }
                                                                          onValueChange={
                                                                            setEditOs
                                                                          }
                                                                        >
                                                                          <SelectTrigger className="w-full">
                                                                            <SelectValue placeholder="Select OS" />
                                                                          </SelectTrigger>
                                                                          <SelectContent>
                                                                            <SelectItem value="Windows">
                                                                              Windows
                                                                            </SelectItem>
                                                                            <SelectItem value="Linux">
                                                                              Linux
                                                                            </SelectItem>
                                                                            <SelectItem value="MacOS">
                                                                              MacOS
                                                                            </SelectItem>
                                                                          </SelectContent>
                                                                        </Select>
                                                                      </div>
                                                                      <div className="grid w-full items-center gap-1.5">
                                                                        <Label htmlFor="editIp">
                                                                          IP
                                                                          Adress
                                                                        </Label>
                                                                        <Input
                                                                          id="editIp"
                                                                          type="text"
                                                                          placeholder="e.g. 192.168.100.2"
                                                                          value={
                                                                            editIp
                                                                          }
                                                                          onChange={(
                                                                            e
                                                                          ) =>
                                                                            setEditIp(
                                                                              e
                                                                                .target
                                                                                .value
                                                                            )
                                                                          }
                                                                        />
                                                                      </div>
                                                                      <div className="grid w-full items-center gap-1.5">
                                                                        <Label htmlFor="editUrl">
                                                                          Management
                                                                          URL
                                                                        </Label>
                                                                        <Input
                                                                          id="editUrl"
                                                                          type="text"
                                                                          placeholder="e.g. https://proxmox.server1.com"
                                                                          value={
                                                                            editUrl
                                                                          }
                                                                          onChange={(
                                                                            e
                                                                          ) =>
                                                                            setEditUrl(
                                                                              e
                                                                                .target
                                                                                .value
                                                                            )
                                                                          }
                                                                        />
                                                                      </div>
                                                                    </div>
                                                                  </TabsContent>

                                                                  <TabsContent value="hardware">
                                                                    <div className="space-y-4 pt-4">
                                                                      <div className="grid w-full items-center gap-1.5">
                                                                        <Label htmlFor="editCpu">
                                                                          CPU
                                                                        </Label>
                                                                        <Input
                                                                          id="editCpu"
                                                                          value={
                                                                            editCpu
                                                                          }
                                                                          onChange={(
                                                                            e
                                                                          ) =>
                                                                            setEditCpu(
                                                                              e
                                                                                .target
                                                                                .value
                                                                            )
                                                                          }
                                                                        />
                                                                      </div>
                                                                      <div className="grid w-full items-center gap-1.5">
                                                                        <Label htmlFor="editGpu">
                                                                          GPU
                                                                        </Label>
                                                                        <Input
                                                                          id="editGpu"
                                                                          value={
                                                                            editGpu
                                                                          }
                                                                          onChange={(
                                                                            e
                                                                          ) =>
                                                                            setEditGpu(
                                                                              e
                                                                                .target
                                                                                .value
                                                                            )
                                                                          }
                                                                        />
                                                                      </div>
                                                                      <div className="grid w-full items-center gap-1.5">
                                                                        <Label htmlFor="editRam">
                                                                          RAM
                                                                        </Label>
                                                                        <Input
                                                                          id="editRam"
                                                                          value={
                                                                            editRam
                                                                          }
                                                                          onChange={(
                                                                            e
                                                                          ) =>
                                                                            setEditRam(
                                                                              e
                                                                                .target
                                                                                .value
                                                                            )
                                                                          }
                                                                        />
                                                                      </div>
                                                                      <div className="grid w-full items-center gap-1.5">
                                                                        <Label htmlFor="editDisk">
                                                                          Disk
                                                                        </Label>
                                                                        <Input
                                                                          id="editDisk"
                                                                          value={
                                                                            editDisk
                                                                          }
                                                                          onChange={(
                                                                            e
                                                                          ) =>
                                                                            setEditDisk(
                                                                              e
                                                                                .target
                                                                                .value
                                                                            )
                                                                          }
                                                                        />
                                                                      </div>
                                                                    </div>
                                                                  </TabsContent>
                                                                  <TabsContent value="virtualization">
                                                                    <div className="space-y-4 pt-4">
                                                                      <div className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                          id="editHostCheckbox"
                                                                          checked={
                                                                            editHost
                                                                          }
                                                                          onCheckedChange={(
                                                                            checked
                                                                          ) =>
                                                                            setEditHost(
                                                                              checked ===
                                                                                true
                                                                            )
                                                                          }
                                                                        />
                                                                        <Label htmlFor="editHostCheckbox">
                                                                          Mark as
                                                                          host
                                                                          server
                                                                        </Label>
                                                                      </div>
                                                                      {!editHost && (
                                                                        <div className="grid w-full items-center gap-1.5">
                                                                          <Label>
                                                                            Host
                                                                            Server
                                                                          </Label>
                                                                          <Select
                                                                            value={editHostServer?.toString()}
                                                                            onValueChange={(
                                                                              value
                                                                            ) =>
                                                                              setEditHostServer(
                                                                                Number(
                                                                                  value
                                                                                )
                                                                              )
                                                                            }
                                                                          >
                                                                            <SelectTrigger>
                                                                              <SelectValue placeholder="Select a host server" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                              {hostServers.map(
                                                                                (
                                                                                  server
                                                                                ) => (
                                                                                  <SelectItem
                                                                                    key={
                                                                                      server.id
                                                                                    }
                                                                                    value={server.id.toString()}
                                                                                  >
                                                                                    {
                                                                                      server.name
                                                                                    }
                                                                                  </SelectItem>
                                                                                )
                                                                              )}
                                                                            </SelectContent>
                                                                          </Select>
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                  </TabsContent>
                                                                </Tabs>
                                                              </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                              <AlertDialogCancel>
                                                                Cancel
                                                              </AlertDialogCancel>
                                                              <Button
                                                                onClick={edit}
                                                              >
                                                                Save
                                                              </Button>
                                                            </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                        </AlertDialog>
                                                      </div>
                                                    </div>

                                                      <div className="col-span-fullpb-2">
                                                        <Separator />
                                                      </div>

                                                      <div className="flex gap-5 pb-2">
                                                        <div className="flex items-center gap-2 text-foreground/80">
                                                          <MonitorCog className="h-4 w-4 text-muted-foreground" />
                                                          <span>
                                                            <b>OS:</b>{" "}
                                                            {hostedVM.os || "-"}
                                                          </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-foreground/80">
                                                          <FileDigit className="h-4 w-4 text-muted-foreground" />
                                                          <span>
                                                            <b>IP:</b>{" "}
                                                            {hostedVM.ip ||
                                                              "Not set"}
                                                          </span>
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center gap-2 text-foreground/80">
                                                        <Cpu className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                          <b>CPU:</b>{" "}
                                                          {hostedVM.cpu || "-"}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2 text-foreground/80">
                                                        <Microchip className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                          <b>GPU:</b>{" "}
                                                          {hostedVM.gpu || "-"}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2 text-foreground/80">
                                                        <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                          <b>RAM:</b>{" "}
                                                          {hostedVM.ram || "-"}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2 text-foreground/80">
                                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                          <b>Disk:</b>{" "}
                                                          {hostedVM.disk || "-"}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </ScrollArea>
                                          </div>
                                        )}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Close
                                      </AlertDialogCancel>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="inline-block" role="status" aria-label="loading">
                <svg
                  className="w-6 h-6 stroke-white animate-spin "
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clip-path="url(#clip0_9023_61563)">
                    <path
                      d="M14.6437 2.05426C11.9803 1.2966 9.01686 1.64245 6.50315 3.25548C1.85499 6.23817 0.504864 12.4242 3.48756 17.0724C6.47025 21.7205 12.6563 23.0706 17.3044 20.088C20.4971 18.0393 22.1338 14.4793 21.8792 10.9444"
                      stroke="stroke-current"
                      stroke-width="1.4"
                      stroke-linecap="round"
                      className="my-path"
                    ></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_9023_61563">
                      <rect width="24" height="24" fill="white"></rect>
                    </clipPath>
                  </defs>
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}
          <div className="pt-4 pb-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePrevious}
                    isActive={currentPage > 1}
                    style={{
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    }}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={handleNext}
                    isActive={currentPage < maxPage}
                    style={{
                      cursor:
                        currentPage === maxPage ? "not-allowed" : "pointer",
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
