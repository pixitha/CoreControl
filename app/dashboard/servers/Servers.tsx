"use client"

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
import { Button } from "@/components/ui/button"
import {
  Plus,
  Link as LinkIcon,
  MonitorIcon as MonitorCog,
  FileDigit,
  Trash2,
  LayoutGrid,
  List,
  Pencil,
  Cpu,
  MicroscopeIcon as Microchip,
  MemoryStick,
  HardDrive,
  LucideServer,
  Copy,
  History,
} from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Cookies from "js-cookie"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DynamicIcon } from "lucide-react/dynamic"
import { StatusIndicator } from "@/components/status-indicator"
import Chart from 'chart.js/auto'
import NextLink from "next/link"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ServerHistory {
  labels: string[];
  datasets: {
    cpu: number[];
    ram: number[];
    disk: number[];
    online: boolean[];
  }
}

interface Server {
  id: number;
  name: string;
  icon: string;
  host: boolean;
  hostServer: number | null;
  os?: string;
  ip?: string;
  url?: string;
  cpu?: string;
  gpu?: string;
  ram?: string;
  disk?: string;
  hostedVMs?: Server[];
  isVM?: boolean;
  monitoring?: boolean;
  monitoringURL?: string;
  online?: boolean;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  history?: ServerHistory;
  port: number;
  uptime: string; 
}

interface GetServersResponse {
  servers: Server[]
  maxPage: number
  totalItems: number
}

interface MonitoringData {
  id: number
  online: boolean
  cpuUsage: number
  ramUsage: number
  diskUsage: number
  uptime: number
}

export default function Dashboard() {
  const [host, setHost] = useState<boolean>(false)
  const [hostServer, setHostServer] = useState<number>(0)
  const [name, setName] = useState<string>("")
  const [icon, setIcon] = useState<string>("")
  const [os, setOs] = useState<string>("")
  const [ip, setIp] = useState<string>("")
  const [url, setUrl] = useState<string>("")
  const [cpu, setCpu] = useState<string>("")
  const [gpu, setGpu] = useState<string>("")
  const [ram, setRam] = useState<string>("")
  const [disk, setDisk] = useState<string>("")
  const [monitoring, setMonitoring] = useState<boolean>(false)
  const [monitoringURL, setMonitoringURL] = useState<string>("")
  const [online, setOnline] = useState<boolean>(false)
  const [cpuUsage, setCpuUsage] = useState<number>(0)
  const [ramUsage, setRamUsage] = useState<number>(0)
  const [diskUsage, setDiskUsage] = useState<number>(0)

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [maxPage, setMaxPage] = useState<number>(1)
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [totalItems, setTotalItems] = useState<number>(0)

  const [editId, setEditId] = useState<number | null>(null)
  const [editHost, setEditHost] = useState<boolean>(false)
  const [editHostServer, setEditHostServer] = useState<number | null>(0)
  const [editName, setEditName] = useState<string>("")
  const [editIcon, setEditIcon] = useState<string>("")
  const [editOs, setEditOs] = useState<string>("")
  const [editIp, setEditIp] = useState<string>("")
  const [editUrl, setEditUrl] = useState<string>("")
  const [editCpu, setEditCpu] = useState<string>("")
  const [editGpu, setEditGpu] = useState<string>("")
  const [editRam, setEditRam] = useState<string>("")
  const [editDisk, setEditDisk] = useState<string>("")
  const [editMonitoring, setEditMonitoring] = useState<boolean>(false)
  const [editMonitoringURL, setEditMonitoringURL] = useState<string>("")

  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isSearching, setIsSearching] = useState<boolean>(false)

  const [hostServers, setHostServers] = useState<Server[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  const savedLayout = Cookies.get("layoutPreference-servers");
  const savedItemsPerPage = Cookies.get("itemsPerPage-servers");
  const initialIsGridLayout = savedLayout === "grid";
  const defaultItemsPerPage = initialIsGridLayout ? 6 : 4;
  const initialItemsPerPage = savedItemsPerPage ? parseInt(savedItemsPerPage) : defaultItemsPerPage;

  const [isGridLayout, setIsGridLayout] = useState<boolean>(initialIsGridLayout);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialItemsPerPage);
  const customInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleLayout = (gridLayout: boolean) => {
    setIsGridLayout(gridLayout);
    Cookies.set("layoutPreference-servers", gridLayout ? "grid" : "standard", {
      expires: 365,
      path: "/",
      sameSite: "strict",
    });
  };

  const add = async () => {
    try {
      await axios.post("/api/servers/add", {
        host,
        hostServer,
        name,
        icon,
        os,
        ip,
        url,
        cpu,
        gpu,
        ram,
        disk,
        monitoring,
        monitoringURL,
      })
      setIsAddDialogOpen(false)
      setHost(false)
      setHostServer(0)
      setIcon("")
      setName("")
      setOs("")
      setIp("")
      setUrl("")
      setCpu("")
      setGpu("")
      setRam("")
      setDisk("")
      setMonitoring(false)
      setMonitoringURL("")
      getServers()
      toast.success("Server added successfully");
    } catch (error: any) {
      console.log(error.response.data)
      toast.error("Failed to add server");
    }
  }

  const getServers = async () => {
    try {
      setLoading(true)
      const response = await axios.post<GetServersResponse>("/api/servers/get", {
        page: currentPage,
        ITEMS_PER_PAGE: itemsPerPage,
      })
      for (const server of response.data.servers) {
        console.log("Host Server:" + server.hostServer)
        console.log("ID:" + server.id)
      }
      setServers(response.data.servers)
      console.log(response.data.servers)
      setMaxPage(response.data.maxPage)
      setTotalItems(response.data.totalItems)
      setLoading(false)
    } catch (error: any) {
      console.log(error.response)
      toast.error("Failed to fetch servers");
    }
  }

  useEffect(() => {
    getServers()
  }, [currentPage, itemsPerPage])

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(maxPage, prev + 1))
  }

  const deleteApplication = async (id: number) => {
    try {
      await axios.post("/api/servers/delete", { id })
      getServers()
      toast.success("Server deleted successfully");
    } catch (error: any) {
      console.log(error.response.data)
      toast.error("Failed to delete server");
    }
  }

  const openEditDialog = (server: Server) => {
    setEditId(server.id)
    setEditHost(server.host)
    setEditHostServer(server.hostServer || null)
    setEditName(server.name)
    setEditIcon(server.icon || "")
    setEditOs(server.os || "")
    setEditIp(server.ip || "")
    setEditUrl(server.url || "")
    setEditCpu(server.cpu || "")
    setEditGpu(server.gpu || "")
    setEditRam(server.ram || "")
    setEditDisk(server.disk || "")
    setEditMonitoring(server.monitoring || false)
    setEditMonitoringURL(server.monitoringURL || "")
  }

  const edit = async () => {
    if (!editId) return

    try {
      await axios.put("/api/servers/edit", {
        id: editId,
        host: editHost,
        hostServer: editHostServer,
        name: editName,
        icon: editIcon,
        os: editOs,
        ip: editIp,
        url: editUrl,
        cpu: editCpu,
        gpu: editGpu,
        ram: editRam,
        disk: editDisk,
        monitoring: editMonitoring,
        monitoringURL: editMonitoringURL,
      })
      getServers()
      setEditId(null)
      toast.success("Server edited successfully");
    } catch (error: any) {
      console.log(error.response.data)
      toast.error("Failed to edit server");
    }
  }

  const searchServers = async () => {
    try {
      setIsSearching(true)
      const response = await axios.post<{ results: Server[] }>("/api/servers/search", { searchterm: searchTerm })
      setServers(response.data.results)
      setMaxPage(1)
      setIsSearching(false)
     } catch (error: any) {
      console.error("Search error:", error.response?.data)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim() === "") {
        getServers()
      } else {
        searchServers()
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  useEffect(() => {
    const fetchHostServers = async () => {
      try {
        const response = await axios.get<{ servers: Server[] }>("/api/servers/hosts")
        setHostServers(response.data.servers)
      } catch (error) {
        console.error("Error fetching host servers:", error)
      }
    }

    if (isAddDialogOpen || editId !== null) {
      fetchHostServers()
    }
  }, [isAddDialogOpen, editId])

  // Add this function to get the host server name for a VM
  const getHostServerName = (hostServerId: number | null) => {
    if (!hostServerId) return ""
    const hostServer = servers.find((server) => server.id === hostServerId)
    return hostServer ? hostServer.name : ""
  }

  const iconCategories = {
    Infrastructure: ["server", "network", "database", "cloud", "hard-drive", "router", "wifi", "antenna"],
    Computing: ["cpu", "microchip", "memory-stick", "terminal", "code", "binary", "command"],
    Monitoring: ["activity", "monitor", "gauge", "bar-chart", "line-chart", "pie-chart"],
    Security: ["shield", "lock", "key", "fingerprint", "scan-face"],
    Status: ["check-circle", "x-octagon", "alert-triangle", "alarm-check", "life-buoy"],
    Other: [
      "settings",
      "power",
      "folder",
      "file-code",
      "clipboard-list",
      "git-branch",
      "git-commit",
      "git-merge",
      "git-pull-request",
      "github",
      "bug",
    ],
  }

  // Flatten icons for search
  const allIcons = Object.values(iconCategories).flat()

  const copyServerDetails = (sourceServer: Server) => {
    // First clear all fields
    setName("")
    setIcon("")
    setOs("")
    setIp("")
    setUrl("")
    setCpu("")
    setGpu("")
    setRam("")
    setDisk("")
    setMonitoring(false)
    setMonitoringURL("")
    setHost(false)
    setHostServer(0)

    // Then copy the new server details
    setTimeout(() => {
      setName(sourceServer.name + " (Copy)")
      setIcon(sourceServer.icon || "")
      setOs(sourceServer.os || "")
      setIp(sourceServer.ip || "")
      setUrl(sourceServer.url || "")
      setCpu(sourceServer.cpu || "")
      setGpu(sourceServer.gpu || "")
      setRam(sourceServer.ram || "")
      setDisk(sourceServer.disk || "")
      setMonitoring(sourceServer.monitoring || false)
      setMonitoringURL(sourceServer.monitoringURL || "")
      setHost(sourceServer.host)
      setHostServer(sourceServer.hostServer || 0)
    }, 0)
  }

  const updateMonitoringData = async () => {
    try {
      const response = await axios.get<MonitoringData[]>("/api/servers/monitoring");
      const monitoringData = response.data;

      setServers(prevServers => 
        prevServers.map(server => {
          const serverMonitoring = monitoringData.find(m => m.id === server.id);
          if (serverMonitoring) {
            return {
              ...server,
              online: serverMonitoring.online,
              cpuUsage: serverMonitoring.cpuUsage,
              ramUsage: serverMonitoring.ramUsage,
              diskUsage: serverMonitoring.diskUsage
            };
          }
          return server;
        })
      );
    } catch (error) {
      console.error("Error updating monitoring data:", error);
      toast.error("Failed to update monitoring data");
    }
  };

  // Set up monitoring interval
  useEffect(() => {
    updateMonitoringData();
    const interval = setInterval(updateMonitoringData, 5000);
    setMonitoringInterval(interval);

    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, []);

  // Handler für benutzerdefinierte Zahleneingaben mit Verzögerung
  const handleItemsPerPageChange = (value: string) => {
    // Bestehenden Timer löschen
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Neuen Timer setzen
    debounceTimerRef.current = setTimeout(() => {
      const newItemsPerPage = parseInt(value);
      
      // Sicherstellen, dass der Wert im gültigen Bereich liegt
      if (isNaN(newItemsPerPage) || newItemsPerPage < 1) {
        toast.error("Bitte eine Zahl zwischen 1 und 100 eingeben");
        return;
      }
      
      const validatedValue = Math.min(Math.max(newItemsPerPage, 1), 100);
      
      setItemsPerPage(validatedValue);
      setCurrentPage(1); // Zurück zur ersten Seite
      Cookies.set("itemsPerPage-servers", String(validatedValue), {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
      
      // Daten mit neuer Paginierung abrufen
      getServers();
    }, 600); // 600ms Verzögerung für bessere Eingabe mehrziffriger Zahlen
  };

  // Handler für voreingestellte Werte aus dem Dropdown
  const handlePresetItemsPerPageChange = (value: string) => {
    // Für voreingestellte Werte sofort anwenden
    const newItemsPerPage = parseInt(value);
    
    // Nur Standardwerte hier verarbeiten
    if ([4, 6, 10, 15, 20, 25].includes(newItemsPerPage)) {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1); // Zurück zur ersten Seite
      Cookies.set("itemsPerPage-servers", String(newItemsPerPage), {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
      
      // Daten mit neuer Paginierung abrufen
      getServers();
    } else {
      // Für benutzerdefinierte Werte den verzögerten Handler verwenden
      handleItemsPerPageChange(value);
    }
  };

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
        <Toaster />
        <div className="p-6">
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">Your Servers</span>
            <div className="flex gap-2">              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" title="Change view">
                    {isGridLayout ? (
                      <LayoutGrid className="h-4 w-4" />
                    ) : (
                      <List className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleLayout(false)}>
                    <List className="h-4 w-4 mr-2" /> List View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleLayout(true)}>
                    <LayoutGrid className="h-4 w-4 mr-2" /> Grid View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Select
                value={String(itemsPerPage)}
                onValueChange={handlePresetItemsPerPageChange}
                onOpenChange={(open) => {
                  if (open && customInputRef.current) {
                    customInputRef.current.value = String(itemsPerPage);
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    {itemsPerPage} {itemsPerPage === 1 ? 'item' : 'items'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {![4, 6, 10, 15, 20, 25].includes(itemsPerPage) ? (
                    <SelectItem value={String(itemsPerPage)}>
                      {itemsPerPage} {itemsPerPage === 1 ? 'item' : 'items'} (custom)
                    </SelectItem>
                  ) : null}
                  <SelectItem value="4">4 items</SelectItem>
                  <SelectItem value="6">6 items</SelectItem>
                  <SelectItem value="10">10 items</SelectItem>
                  <SelectItem value="15">15 items</SelectItem>
                  <SelectItem value="20">20 items</SelectItem>
                  <SelectItem value="25">25 items</SelectItem>
                  <div className="p-2 border-t mt-1">
                    <Label htmlFor="custom-items" className="text-xs font-medium">Custom (1-100)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="custom-items"
                        ref={customInputRef}
                        type="number"
                        min="1"
                        max="100"
                        className="h-8"
                        defaultValue={itemsPerPage}
                        onChange={(e) => {
                          // Änderung nicht sofort anwenden während des Tippens
                          // Nur visuelles Feedback für die Validierung
                          const value = parseInt(e.target.value);
                          if (isNaN(value) || value < 1 || value > 100) {
                            e.target.classList.add("border-red-500");
                          } else {
                            e.target.classList.remove("border-red-500");
                          }
                        }}
                        onBlur={(e) => {
                          // Änderung anwenden, wenn das Input den Fokus verliert
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            handleItemsPerPageChange(e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            // Bestehenden Debounce-Timer löschen, um sofort anzuwenden
                            if (debounceTimerRef.current) {
                              clearTimeout(debounceTimerRef.current);
                              debounceTimerRef.current = null;
                            }
                            
                            const value = parseInt((e.target as HTMLInputElement).value);
                            if (value >= 1 && value <= 100) {
                              // Änderung sofort bei Enter anwenden
                              const validatedValue = Math.min(Math.max(value, 1), 100);
                              setItemsPerPage(validatedValue);
                              setCurrentPage(1);
                              Cookies.set("itemsPerPage-servers", String(validatedValue), {
                                expires: 365,
                                path: "/",
                                sameSite: "strict",
                              });
                              
                              // Kurze Verzögerung hinzufügen für bessere Reaktionsfähigkeit
                              setTimeout(() => {
                                getServers();
                                
                                // Dropdown schließen
                                document.body.click();
                              }, 50);
                            }
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">items</span>
                    </div>
                  </div>
                </SelectContent>
              </Select>
              
              <AlertDialog onOpenChange={setIsAddDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex justify-between items-center">
                      <span>Add a server</span>
                      <Select 
                        onValueChange={(value) => {
                          if (!value) return;
                          const sourceServer = servers.find(s => s.id === parseInt(value));
                          if (!sourceServer) return;
                          
                          // Clear all fields first
                          setName("");
                          setIcon("");
                          setOs("");
                          setIp("");
                          setUrl("");
                          setCpu("");
                          setGpu("");
                          setRam("");
                          setDisk("");
                          setMonitoring(false);
                          setMonitoringURL("");
                          setHost(false);
                          setHostServer(0);

                          // Copy new server details
                          setName(sourceServer.name + " (Copy)");
                          setIcon(sourceServer.icon || "");
                          setOs(sourceServer.os || "");
                          setIp(sourceServer.ip || "");
                          setUrl(sourceServer.url || "");
                          setCpu(sourceServer.cpu || "");
                          setGpu(sourceServer.gpu || "");
                          setRam(sourceServer.ram || "");
                          setDisk(sourceServer.disk || "");
                          setMonitoring(sourceServer.monitoring || false);
                          setMonitoringURL(sourceServer.monitoringURL || "");
                          setHost(sourceServer.host);
                          setHostServer(sourceServer.hostServer || 0);
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Copy className="h-3 w-3 text-muted-foreground" />
                            <SelectValue placeholder="Copy server" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {servers.map((server) => (
                            <SelectItem key={server.id} value={server.id.toString()} className="text-sm">
                              {server.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <Tabs defaultValue="general" className="w-full">
                        <TabsList className="w-full">
                          <TabsTrigger value="general">General</TabsTrigger>
                          <TabsTrigger value="hardware">Hardware</TabsTrigger>
                          <TabsTrigger value="virtualization">Virtualization</TabsTrigger>
                          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                          <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2">
                              <div className="grid w-[calc(100%-52px)] items-center gap-1.5">
                                <Label htmlFor="icon">Icon</Label>
                                <div className="space-y-2">
                                  <Select value={icon} onValueChange={(value) => setIcon(value)}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select an icon">
                                        {icon && (
                                          <div className="flex items-center gap-2">
                                            <DynamicIcon name={icon as any} size={18} />
                                            <span>{icon}</span>
                                          </div>
                                        )}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                      <Input
                                        placeholder="Search icons..."
                                        className="mb-2"
                                        onChange={(e) => {
                                          const iconElements = document.querySelectorAll("[data-icon-item]")
                                          const searchTerm = e.target.value.toLowerCase()

                                          iconElements.forEach((el) => {
                                            const iconName = el.getAttribute("data-icon-name")?.toLowerCase() || ""
                                            if (iconName.includes(searchTerm)) {
                                              ;(el as HTMLElement).style.display = "flex"
                                            } else {
                                              ;(el as HTMLElement).style.display = "none"
                                            }
                                          })
                                        }}
                                      />
                                      {Object.entries(iconCategories).map(([category, categoryIcons]) => (
                                        <div key={category} className="mb-2">
                                          <div className="px-2 text-xs font-bold text-muted-foreground mb-1">
                                            {category}
                                          </div>
                                          {categoryIcons.map((iconName) => (
                                            <SelectItem
                                              key={iconName}
                                              value={iconName}
                                              data-icon-item
                                              data-icon-name={iconName}
                                            >
                                              <div className="flex items-center gap-2">
                                                <DynamicIcon name={iconName as any} size={18} />
                                                <span>{iconName}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </div>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid w-[52px] items-center gap-1.5">
                                <Label htmlFor="icon">Preview</Label>
                                <div className="flex items-center justify-center">
                                  {icon && <DynamicIcon name={icon as any} size={36} />}
                                </div>
                              </div>
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                type="text"
                                placeholder="e.g. Server1"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="description">
                                Operating System <span className="text-stone-600">(optional)</span>
                              </Label>
                              <Select value={os} onValueChange={(value) => setOs(value)}>
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
                              <Label htmlFor="ip">
                                IP Adress <span className="text-stone-600">(optional)</span>
                              </Label>
                              <Input
                                id="ip"
                                type="text"
                                placeholder="e.g. 192.168.100.2"
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Label htmlFor="publicURL">
                                      Management URL <span className="text-stone-600">(optional)</span>
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Link to a web interface (e.g. Proxmox or Portainer) with which the server can be
                                    managed
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Input
                                id="publicURL"
                                type="text"
                                placeholder="e.g. https://proxmox.server1.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="hardware">
                          <div className="space-y-4 pt-4">
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="cpu">
                                CPU <span className="text-stone-600">(optional)</span>
                              </Label>
                              <Input
                                id="cpu"
                                type="text"
                                placeholder="e.g. AMD Ryzen™ 7 7800X3D"
                                value={cpu}
                                onChange={(e) => setCpu(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="gpu">
                                GPU <span className="text-stone-600">(optional)</span>
                              </Label>
                              <Input
                                id="gpu"
                                type="text"
                                placeholder="e.g. AMD Radeon™ Graphics"
                                value={gpu}
                                onChange={(e) => setGpu(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="ram">
                                RAM <span className="text-stone-600">(optional)</span>
                              </Label>
                              <Input
                                id="ram"
                                type="text"
                                placeholder="e.g. 64GB DDR5"
                                value={ram}
                                onChange={(e) => setRam(e.target.value)}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="disk">
                                Disk <span className="text-stone-600">(optional)</span>
                              </Label>
                              <Input
                                id="disk"
                                type="text"
                                placeholder="e.g. 2TB SSD"
                                value={disk}
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
                                onCheckedChange={(checked) => setHost(checked === true)}
                              />
                              <Label htmlFor="hostCheckbox">Mark as host server</Label>
                            </div>
                            {!host && (
                              <div className="grid w-full items-center gap-1.5">
                                <Label>Host Server</Label>
                                <Select
                                  value={hostServer?.toString()}
                                  onValueChange={(value) => {
                                    const newHostServer = Number(value);
                                    setHostServer(newHostServer);
                                    if (newHostServer !== 0) {
                                      setMonitoring(false);
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a host server" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">No host server</SelectItem>
                                    {hostServers.map((server) => (
                                      <SelectItem key={server.id} value={server.id.toString()}>
                                        {server.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        <TabsContent value="monitoring">
                          <div className="space-y-4 pt-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="monitoringCheckbox"
                                checked={monitoring}
                                onCheckedChange={(checked) => setMonitoring(checked === true)}
                              />
                              <Label htmlFor="monitoringCheckbox">Enable monitoring</Label>
                            </div>
                            {monitoring && (
                              <>
                                <div className="grid w-full items-center gap-1.5">
                                  <Label htmlFor="monitoringURL">Monitoring URL</Label>
                                  <Input
                                    id="monitoringURL"
                                    type="text"
                                    placeholder={`http://${ip}:61208`}
                                    value={monitoringURL}
                                    onChange={(e) => setMonitoringURL(e.target.value)}
                                  />
                                </div>
                                <div className="mt-4 p-4 border rounded-lg bg-muted">
                                  <h4 className="text-sm font-semibold mb-2">Required Server Setup</h4>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    To enable monitoring, you need to install Glances on your server. Here's an example Docker Compose configuration:
                                  </p>
                                  <pre className="bg-background p-4 rounded-md text-sm">
                                    <code>{`services:
  glances:
    image: nicolargo/glances:latest
    container_name: glances
    restart: unless-stopped
    ports:
      - "61208:61208"
    pid: "host"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - GLANCES_OPT=-w --disable-webui`}</code>
                                  </pre>
                                </div>
                              </>
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
            <div className={isGridLayout ? "grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}>
              {servers
                .filter((server) => (searchTerm ? true : server.hostServer === 0))
                .map((server) => {
                  return (
                    <Card
                      key={server.id}
                      className={`${isGridLayout ? "h-full flex flex-col justify-between" : "w-full mb-4"} hover:shadow-md transition-all duration-200 max-w-full relative`}
                    >
                      <CardHeader>
                        {server.monitoring && (
                          <div className="absolute top-4 right-4 flex flex-col items-end">
                            <StatusIndicator isOnline={server.online} />
                            {server.online && server.uptime && (
                              <span className="text-xs text-muted-foreground mt-1">
                                since {server.uptime}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center w-full">
                            <div className="ml-4 flex-grow">
                              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  {server.icon && <DynamicIcon name={server.icon as any} size={24} />}
                                  <NextLink href={`/dashboard/servers/${server.id}`} className="hover:underline">
                                    <span className="font-bold">
                                      {server.icon && "･"} {server.name}
                                    </span>
                                  </NextLink>
                                </div>
                                {server.isVM && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">VM</span>
                                )}
                              </CardTitle>
                              <CardDescription
                                className={`text-sm mt-1 grid gap-y-1 ${
                                  isGridLayout ? "grid-cols-1" : "grid-cols-2 gap-x-4"
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

                                {server.isVM && server.hostServer && (
                                  <div className="flex items-center gap-2 text-foreground/80">
                                    <LucideServer className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      <b>Host:</b> {getHostServerName(server.hostServer)}
                                    </span>
                                  </div>
                                )}

                                <div className="col-span-full pt-2 pb-2">
                                  <Separator />
                                </div>

                                <div className="col-span-full mb-2">
                                  <h4 className="text-sm font-semibold">Hardware Information</h4>
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

                                {server.monitoring && server.hostServer === 0 && (
                                  <>
                                    <div className="col-span-full pt-2 pb-2">
                                      <Separator />
                                    </div>

                                    <div className="col-span-full">
                                      <h4 className="text-sm font-semibold mb-3">Resource Usage</h4>
                                      <div className={`${!isGridLayout ? "grid grid-cols-[1fr_1fr_1fr_auto] gap-4" : "space-y-3"}`}>
                                        <div>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Cpu className="h-4 w-4 text-muted-foreground" />
                                              <span className="text-sm font-medium">CPU</span>
                                            </div>
                                            <span className="text-xs font-medium">{server.cpuUsage || 0}%</span>
                                          </div>
                                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                                            <div
                                              className={`h-full ${server.cpuUsage && server.cpuUsage > 80 ? "bg-destructive" : server.cpuUsage && server.cpuUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                              style={{ width: `${server.cpuUsage || 0}%` }}
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                              <span className="text-sm font-medium">RAM</span>
                                            </div>
                                            <span className="text-xs font-medium">{server.ramUsage || 0}%</span>
                                          </div>
                                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                                            <div
                                              className={`h-full ${server.ramUsage && server.ramUsage > 80 ? "bg-destructive" : server.ramUsage && server.ramUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                              style={{ width: `${server.ramUsage || 0}%` }}
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <HardDrive className="h-4 w-4 text-muted-foreground" />
                                              <span className="text-sm font-medium">Disk</span>
                                            </div>
                                            <span className="text-xs font-medium">{server.diskUsage || 0}%</span>
                                          </div>
                                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                                            <div
                                              className={`h-full ${server.diskUsage && server.diskUsage > 80 ? "bg-destructive" : server.diskUsage && server.diskUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                              style={{ width: `${server.diskUsage || 0}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <div className="px-6">
                        <div className="flex gap-2 mt-2 mb-2">
                          <NextLink href={`/dashboard/servers/${server.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              <History className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </NextLink>
                          
                          {server.url && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => window.open(server.url, "_blank")}
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open Management URL</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  onClick={() => {
                                    openEditDialog(server);
                                    
                                    // Open the dialog after setting the values
                                    const dialogTriggerButton = document.getElementById(`edit-dialog-trigger-${server.id}`);
                                    if (dialogTriggerButton) {
                                      dialogTriggerButton.click();
                                    }
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit server</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {server.host && server.hostedVMs && server.hostedVMs.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="icon">
                                        <LucideServer className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hosted VMs</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {server.host && (
                                            <div className="mt-4">
                                              <ScrollArea className="h-[500px] w-full pr-3">
                                                <div className="space-y-2 mt-2">
                                                  {server.hostedVMs?.map((hostedVM) => (
                                                    <div
                                                      key={hostedVM.id}
                                                      className="flex flex-col gap-2 border border-muted py-2 px-4 rounded-md"
                                                    >
                                                      <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                          {hostedVM.icon && (
                                                            <DynamicIcon
                                                              name={hostedVM.icon as any}
                                                              size={24}
                                                            />
                                                          )}
                                                          <div className="text-base font-extrabold">
                                                            {hostedVM.icon && "･ "}
                                                            {hostedVM.name}
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-foreground/80">
                                                        { hostedVM.url && (
                                                          <Button
                                                            variant="outline"
                                                            className="gap-2"
                                                            onClick={() => window.open(hostedVM.url, "_blank")}
                                                          >
                                                            <LinkIcon className="h-4 w-4" />
                                                          </Button>
                                                          )}
                                                          <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-9 w-9"
                                                            onClick={() => deleteApplication(hostedVM.id)}
                                                          >
                                                            <Trash2 className="h-4 w-4" />
                                                          </Button>

                                                          <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                              <Button
                                                                size="icon"
                                                                className="h-9 w-9"
                                                                onClick={() => openEditDialog(hostedVM)}
                                                              >
                                                                <Pencil className="h-4 w-4" />
                                                              </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                              <AlertDialogHeader>
                                                                <AlertDialogTitle>Edit VM</AlertDialogTitle>
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
                                                                        <div className="flex items-center gap-2">
                                                                          <div className="grid w-[calc(100%-52px)] items-center gap-1.5">
                                                                            <Label htmlFor="editIcon">Icon</Label>
                                                                            <div className="space-y-2">
                                                                              <Select
                                                                                value={editIcon}
                                                                                onValueChange={(value) =>
                                                                                  setEditIcon(value)
                                                                                }
                                                                              >
                                                                                <SelectTrigger className="w-full">
                                                                                  <SelectValue placeholder="Select an icon">
                                                                                    {editIcon && (
                                                                                      <div className="flex items-center gap-2">
                                                                                        <DynamicIcon
                                                                                          name={editIcon as any}
                                                                                          size={18}
                                                                                        />
                                                                                        <span>{editIcon}</span>
                                                                                      </div>
                                                                                    )}
                                                                                  </SelectValue>
                                                                                </SelectTrigger>
                                                                                <SelectContent className="max-h-[300px]">
                                                                                  <Input
                                                                                    placeholder="Search icons..."
                                                                                    className="mb-2"
                                                                                    onChange={(e) => {
                                                                                      const iconElements =
                                                                                        document.querySelectorAll(
                                                                                          "[data-vm-edit-icon-item]",
                                                                                        )
                                                                                      const searchTerm =
                                                                                        e.target.value.toLowerCase()

                                                                                      iconElements.forEach((el) => {
                                                                                        const iconName =
                                                                                          el
                                                                                            .getAttribute(
                                                                                              "data-icon-name",
                                                                                            )
                                                                                            ?.toLowerCase() || ""
                                                                                        if (
                                                                                          iconName.includes(searchTerm)
                                                                                        ) {
                                                                                          ;(
                                                                                            el as HTMLElement
                                                                                          ).style.display = "flex"
                                                                                        } else {
                                                                                          ;(
                                                                                            el as HTMLElement
                                                                                          ).style.display = "none"
                                                                                        }
                                                                                      })
                                                                                    }}
                                                                                  />
                                                                                  {Object.entries(iconCategories).map(
                                                                                    ([category, categoryIcons]) => (
                                                                                      <div
                                                                                        key={category}
                                                                                        className="mb-2"
                                                                                      >
                                                                                        <div className="px-2 text-xs font-bold text-muted-foreground mb-1">
                                                                                          {category}
                                                                                        </div>
                                                                                        {categoryIcons.map((iconName) => (
                                                                                          <SelectItem
                                                                                            key={iconName}
                                                                                            value={iconName}
                                                                                            data-vm-edit-icon-item
                                                                                            data-icon-name={iconName}
                                                                                          >
                                                                                            <div className="flex items-center gap-2">
                                                                                              <DynamicIcon
                                                                                                name={iconName as any}
                                                                                                size={18}
                                                                                              />
                                                                                              <span>{iconName}</span>
                                                                                            </div>
                                                                                          </SelectItem>
                                                                                        ))}
                                                                                      </div>
                                                                                    ),
                                                                                  )}
                                                                                </SelectContent>
                                                                              </Select>
                                                                            </div>
                                                                          </div>
                                                                          <div className="grid w-[52px] items-center gap-1.5">
                                                                            <Label htmlFor="editIcon">Preview</Label>
                                                                            <div className="flex items-center justify-center">
                                                                              {editIcon && (
                                                                                <DynamicIcon
                                                                                  name={editIcon as any}
                                                                                  size={36}
                                                                                />
                                                                              )}
                                                                            </div>
                                                                          </div>
                                                                        </div>
                                                                        <div className="grid w-full items-center gap-1.5">
                                                                          <Label htmlFor="editName">Name</Label>
                                                                          <Input
                                                                            id="editName"
                                                                            type="text"
                                                                            placeholder="e.g. Server1"
                                                                            value={editName}
                                                                            onChange={(e) => setEditName(e.target.value)}
                                                                          />
                                                                        </div>
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
                                                                              <SelectItem value="Windows">
                                                                                Windows
                                                                              </SelectItem>
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
                                                                    <TabsContent value="virtualization">
                                                                      <div className="space-y-4 pt-4">
                                                                        <div className="flex items-center space-x-2">
                                                                          <Checkbox
                                                                            id="editHostCheckbox"
                                                                            checked={editHost}
                                                                            onCheckedChange={(checked) =>
                                                                              setEditHost(checked === true)
                                                                            }
                                                                            disabled={
                                                                              server.hostedVMs &&
                                                                              server.hostedVMs.length > 0
                                                                            }
                                                                          />
                                                                          <Label htmlFor="editHostCheckbox">
                                                                            Mark as host server
                                                                            {server.hostedVMs &&
                                                                              server.hostedVMs.length > 0 && (
                                                                                <span className="text-muted-foreground text-sm ml-2">
                                                                                  (Cannot be disabled while hosting VMs)
                                                                                </span>
                                                                              )}
                                                                          </Label>
                                                                        </div>
                                                                        {!editHost && (
                                                                          <div className="grid w-full items-center gap-1.5">
                                                                            <Label>Host Server</Label>
                                                                            <Select
                                                                              value={editHostServer?.toString()}
                                                                              onValueChange={(value) => {
                                                                                const newHostServer = Number(value);
                                                                                setEditHostServer(newHostServer);
                                                                                if (newHostServer !== 0) {
                                                                                  setEditMonitoring(false);
                                                                                }
                                                                              }}
                                                                            >
                                                                              <SelectTrigger>
                                                                                <SelectValue placeholder="Select a host server" />
                                                                              </SelectTrigger>
                                                                              <SelectContent>
                                                                                <SelectItem value="0">No host server</SelectItem>
                                                                                {hostServers
                                                                                  .filter(
                                                                                    (server) => server.id !== editId,
                                                                                  )
                                                                                  .map((server) => (
                                                                                    <SelectItem key={server.id} value={server.id.toString()}>
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
                                                                <Button onClick={edit}>Save</Button>
                                                              </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                          </AlertDialog>
                                                        </div>
                                                      </div>

                                                      <div className="col-span-full pb-2">
                                                        <Separator />
                                                      </div>

                                                      <div className="flex gap-5 pb-2">
                                                        <div className="flex items-center gap-2 text-foreground/80">
                                                          <MonitorCog className="h-4 w-4 text-muted-foreground" />
                                                          <span>
                                                            <b>OS:</b> {hostedVM.os || "-"}
                                                          </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-foreground/80">
                                                          <FileDigit className="h-4 w-4 text-muted-foreground" />
                                                          <span>
                                                            <b>IP:</b> {hostedVM.ip || "Not set"}
                                                          </span>
                                                        </div>
                                                      </div>

                                                      <div className="col-span-full mb-2">
                                                        <h4 className="text-sm font-semibold">Hardware Information</h4>
                                                      </div>

                                                      <div className="flex items-center gap-2 text-foreground/80">
                                                        <Cpu className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                          <b>CPU:</b> {hostedVM.cpu || "-"}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2 text-foreground/80">
                                                        <Microchip className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                          <b>GPU:</b> {hostedVM.gpu || "-"}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2 text-foreground/80">
                                                        <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                          <b>RAM:</b> {hostedVM.ram || "-"}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2 text-foreground/80">
                                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                          <b>Disk:</b> {hostedVM.disk || "-"}
                                                        </span>
                                                      </div>

                                                      {hostedVM.monitoring && (
                                                        <>
                                                          <div className="col-span-full pt-2 pb-2">
                                                            <Separator />
                                                          </div>

                                                          <div className="col-span-full grid grid-cols-3 gap-4">
                                                            <div>
                                                              <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                  <Cpu className="h-4 w-4 text-muted-foreground" />
                                                                  <span className="text-sm font-medium">CPU</span>
                                                                </div>
                                                                <span className="text-xs font-medium">
                                                                  {hostedVM.cpuUsage || 0}%
                                                                </span>
                                                              </div>
                                                              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                                                                <div
                                                                  className={`h-full ${hostedVM.cpuUsage && hostedVM.cpuUsage > 80 ? "bg-destructive" : hostedVM.cpuUsage && hostedVM.cpuUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                                                  style={{ width: `${hostedVM.cpuUsage || 0}%` }}
                                                                />
                                                              </div>
                                                            </div>

                                                            <div>
                                                              <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                                                  <span className="text-sm font-medium">RAM</span>
                                                                </div>
                                                                <span className="text-xs font-medium">
                                                                  {hostedVM.ramUsage || 0}%
                                                                </span>
                                                              </div>
                                                              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                                                                <div
                                                                  className={`h-full ${hostedVM.ramUsage && hostedVM.ramUsage > 80 ? "bg-destructive" : hostedVM.ramUsage && hostedVM.ramUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                                                  style={{ width: `${hostedVM.ramUsage || 0}%` }}
                                                                />
                                                              </div>
                                                            </div>

                                                            <div>
                                                              <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                                                                  <span className="text-sm font-medium">Disk</span>
                                                                </div>
                                                                <span className="text-xs font-medium">
                                                                  {hostedVM.diskUsage || 0}%
                                                                </span>
                                                              </div>
                                                              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                                                                <div
                                                                  className={`h-full ${hostedVM.diskUsage && hostedVM.diskUsage > 80 ? "bg-destructive" : hostedVM.diskUsage && hostedVM.diskUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                                                  style={{ width: `${hostedVM.diskUsage || 0}%` }}
                                                                />
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </ScrollArea>
                                            </div>
                                          )}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Close</AlertDialogCancel>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TooltipTrigger>
                                <TooltipContent>View VMs ({server.hostedVMs.length})</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                id={`edit-dialog-trigger-${server.id}`} 
                                className="hidden"
                              >
                                Hidden Trigger
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Edit {server.name}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="w-full">
                                      <TabsTrigger value="general">General</TabsTrigger>
                                      <TabsTrigger value="hardware">Hardware</TabsTrigger>
                                      <TabsTrigger value="virtualization">Virtualization</TabsTrigger>
                                      <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="general">
                                      <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-2">
                                          <div className="grid w-[calc(100%-52px)] items-center gap-1.5">
                                            <Label htmlFor="editIcon">Icon</Label>
                                            <div className="space-y-2">
                                              <Select
                                                value={editIcon}
                                                onValueChange={(value) => setEditIcon(value)}
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue placeholder="Select an icon">
                                                    {editIcon && (
                                                      <div className="flex items-center gap-2">
                                                        <DynamicIcon name={editIcon as any} size={18} />
                                                        <span>{editIcon}</span>
                                                      </div>
                                                    )}
                                                  </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[300px]">
                                                  <Input
                                                    placeholder="Search icons..."
                                                    className="mb-2"
                                                    onChange={(e) => {
                                                      const iconElements = document.querySelectorAll(
                                                        "[data-icon-item]"
                                                      )
                                                      const searchTerm = e.target.value.toLowerCase()

                                                      iconElements.forEach((el) => {
                                                        const iconName =
                                                          el.getAttribute("data-icon-name")?.toLowerCase() || ""
                                                        if (iconName.includes(searchTerm)) {
                                                          ;(el as HTMLElement).style.display = "flex"
                                                        } else {
                                                          ;(el as HTMLElement).style.display = "none"
                                                        }
                                                      })
                                                    }}
                                                  />
                                                  {Object.entries(iconCategories).map(
                                                    ([category, categoryIcons]) => (
                                                      <div key={category} className="mb-2">
                                                        <div className="px-2 text-xs font-bold text-muted-foreground mb-1">
                                                          {category}
                                                        </div>
                                                        {categoryIcons.map((iconName) => (
                                                          <SelectItem
                                                            key={iconName}
                                                            value={iconName}
                                                            data-icon-item
                                                            data-icon-name={iconName}
                                                          >
                                                            <div className="flex items-center gap-2">
                                                              <DynamicIcon name={iconName as any} size={18} />
                                                              <span>{iconName}</span>
                                                            </div>
                                                          </SelectItem>
                                                        ))}
                                                      </div>
                                                    )
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                          <div className="grid w-[52px] items-center gap-1.5">
                                            <Label htmlFor="editIcon">Preview</Label>
                                            <div className="flex items-center justify-center">
                                              {editIcon && <DynamicIcon name={editIcon as any} size={36} />}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                          <Label htmlFor="editName">Name</Label>
                                          <Input
                                            id="editName"
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                          />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                          <Label htmlFor="editOs">
                                            Operating System <span className="text-stone-600">(optional)</span>
                                          </Label>
                                          <Select value={editOs} onValueChange={(value) => setEditOs(value)}>
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
                                          <Label htmlFor="editIp">
                                            IP Address <span className="text-stone-600">(optional)</span>
                                          </Label>
                                          <Input
                                            id="editIp"
                                            type="text"
                                            value={editIp}
                                            onChange={(e) => setEditIp(e.target.value)}
                                          />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                          <Label htmlFor="editUrl">
                                            Management URL <span className="text-stone-600">(optional)</span>
                                          </Label>
                                          <Input
                                            id="editUrl"
                                            type="text"
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
                                          <Label htmlFor="editHostCheckbox">Mark as host server</Label>
                                        </div>
                                        {!editHost && (
                                          <div className="grid w-full items-center gap-1.5">
                                            <Label>Host Server</Label>
                                            <Select
                                              value={editHostServer?.toString()}
                                              onValueChange={(value) => {
                                                const newHostServer = Number(value);
                                                setEditHostServer(newHostServer);
                                                if (newHostServer !== 0) {
                                                  setEditMonitoring(false);
                                                }
                                              }}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select a host server" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="0">No host server</SelectItem>
                                                {hostServers
                                                  .filter(
                                                    (server) => server.id !== editId,
                                                  )
                                                  .map((server) => (
                                                    <SelectItem key={server.id} value={server.id.toString()}>
                                                      {server.name}
                                                    </SelectItem>
                                                  ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="monitoring">
                                      <div className="space-y-4 pt-4">
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id="editMonitoringCheckbox"
                                            checked={editMonitoring}
                                            onCheckedChange={(checked) => setEditMonitoring(checked === true)}
                                          />
                                          <Label htmlFor="editMonitoringCheckbox">Enable monitoring</Label>
                                        </div>
                                        {editMonitoring && (
                                          <>
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label htmlFor="editMonitoringURL">Monitoring URL</Label>
                                              <Input
                                                id="editMonitoringURL"
                                                type="text"
                                                placeholder={`http://${editIp}:61208`}
                                                value={editMonitoringURL}
                                                onChange={(e) => setEditMonitoringURL(e.target.value)}
                                              />
                                            </div>
                                            <div className="mt-4 p-4 border rounded-lg bg-muted">
                                              <h4 className="text-sm font-semibold mb-2">Required Server Setup</h4>
                                              <p className="text-sm text-muted-foreground mb-3">
                                                To enable monitoring, you need to install Glances on your server. Here's an example Docker Compose configuration:
                                              </p>
                                              <pre className="bg-background p-4 rounded-md text-sm">
                                                <code>{`services:
  glances:
    image: nicolargo/glances:latest
    container_name: glances
    restart: unless-stopped
    ports:
      - "61208:61208"
    pid: "host"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - GLANCES_OPT=-w --disable-webui`}</code>
                                              </pre>
                                            </div>
                                          </>
                                        )}
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
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete {server.name}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this server? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => deleteApplication(server.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TooltipTrigger>
                              <TooltipContent>Delete server</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </Card>
                  )
                })}
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
                  <g clipPath="url(#clip0_9023_61563)">
                    <path
                      d="M14.6437 2.05426C11.9803 1.2966 9.01686 1.64245 6.50315 3.25548C1.85499 6.23817 0.504864 12.4242 3.48756 17.0724C6.47025 21.7205 12.6563 23.0706 17.3044 20.088C20.4971 18.0393 22.1338 14.4793 21.8792 10.9444"
                      stroke="stroke-current"
                      strokeWidth="1.4"
                      strokeLinecap="round"
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
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">
                {totalItems > 0 
                  ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} servers` 
                  : "No servers found"}
              </div>
            </div>
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
                      cursor: currentPage === maxPage ? "not-allowed" : "pointer",
                    }}
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
