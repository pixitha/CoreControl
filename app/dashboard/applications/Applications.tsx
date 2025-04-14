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
  Home,
  Trash2,
  LayoutGrid,
  List,
  Pencil,
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
import axios from "axios";

interface Application {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  publicURL: string;
  localURL?: string;
  server?: string;
  online: boolean;
  serverId: number;
}

interface Server {
  id: number;
  name: string;
}

interface ApplicationsResponse {
  applications: Application[];
  servers: Server[];
  maxPage: number;
}

export default function Dashboard() {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [icon, setIcon] = useState<string>("");
  const [publicURL, setPublicURL] = useState<string>("");
  const [localURL, setLocalURL] = useState<string>("");
  const [serverId, setServerId] = useState<number | null>(null);

  const [editName, setEditName] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editIcon, setEditIcon] = useState<string>("");
  const [editPublicURL, setEditPublicURL] = useState<string>("");
  const [editLocalURL, setEditLocalURL] = useState<string>("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editServerId, setEditServerId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [maxPage, setMaxPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [applications, setApplications] = useState<Application[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [isGridLayout, setIsGridLayout] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    const savedLayout = Cookies.get("layoutPreference-app");
    const layout_bool = savedLayout === "grid";
    setIsGridLayout(layout_bool);
    setItemsPerPage(layout_bool ? 15 : 5);
  }, []);

  const toggleLayout = () => {
    const newLayout = !isGridLayout;
    setIsGridLayout(newLayout);
    Cookies.set("layoutPreference-app", newLayout ? "grid" : "standard", {
      expires: 365,
      path: "/",
      sameSite: "strict",
    });
    setItemsPerPage(newLayout ? 15 : 5);
  };

  const add = async () => {
    try {
      await axios.post("/api/applications/add", {
        name,
        description,
        icon,
        publicURL,
        localURL,
        serverId,
      });
      getApplications();
    } catch (error: any) {
      console.log(error.response?.data);
    }
  };

  const getApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.post<ApplicationsResponse>(
        "/api/applications/get",
        { page: currentPage, ITEMS_PER_PAGE: itemsPerPage }
      );
      setApplications(response.data.applications);
      setServers(response.data.servers);
      setMaxPage(response.data.maxPage);
      setLoading(false);
    } catch (error: any) {
      console.log(error.response?.data);
    }
  };

  useEffect(() => {
    getApplications();
  }, [currentPage, itemsPerPage]);

  const handlePrevious = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(maxPage, prev + 1));

  const deleteApplication = async (id: number) => {
    try {
      await axios.post("/api/applications/delete", { id });
      getApplications();
    } catch (error: any) {
      console.log(error.response?.data);
    }
  };

  const openEditDialog = (app: Application) => {
    setEditId(app.id);
    setEditServerId(app.serverId);
    setEditName(app.name);
    setEditDescription(app.description || "");
    setEditIcon(app.icon || "");
    setEditLocalURL(app.localURL || "");
    setEditPublicURL(app.publicURL || "");
  };

  const edit = async () => {
    if (!editId) return;

    try {
      await axios.put("/api/applications/edit", {
        id: editId,
        serverId: editServerId,
        name: editName,
        description: editDescription,
        icon: editIcon,
        publicURL: editPublicURL,
        localURL: editLocalURL,
      });
      getApplications();
      setEditId(null);
    } catch (error: any) {
      console.log(error.response.data);
    }
  };

  const searchApplications = async () => {
    try {
      setIsSearching(true);
      const response = await axios.post<{ results: Application[] }>(
        "/api/applications/search",
        { searchterm: searchTerm }
      );
      setApplications(response.data.results);
      setIsSearching(false);
    } catch (error: any) {
      console.error("Search error:", error.response?.data);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim() === "") {
        getApplications();
      } else {
        searchApplications();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);


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
                title={
                  isGridLayout ? "Switch to list view" : "Switch to grid view"
                }
              >
                {isGridLayout ? (
                  <List className="h-4 w-4" />
                ) : (
                  <LayoutGrid className="h-4 w-4" />
                )}
              </Button>
              {servers.length === 0 ? (
                <p className="text-muted-foreground">
                  You must first add a server.
                </p>
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
                            <Input
                              placeholder="e.g. Portainer"
                              onChange={(e) => setName(e.target.value)}
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>Server</Label>
                            <Select
                              onValueChange={(v) => setServerId(Number(v))}
                              required
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select server" />
                              </SelectTrigger>
                              <SelectContent>
                                {servers.map((server) => (
                                  <SelectItem
                                    key={server.id}
                                    value={String(server.id)}
                                  >
                                    {server.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>
                              Description{" "}
                              <span className="text-stone-600">(optional)</span>
                            </Label>
                            <Textarea
                              placeholder="Application description"
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>
                              Icon URL{" "}
                              <span className="text-stone-600">(optional)</span>
                            </Label>
                            <Input
                              placeholder="https://example.com/icon.png"
                              onChange={(e) => setIcon(e.target.value)}
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>Public URL</Label>
                            <Input
                              placeholder="https://example.com"
                              onChange={(e) => setPublicURL(e.target.value)}
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>
                              Local URL{" "}
                              <span className="text-stone-600">(optional)</span>
                            </Label>
                            <Input
                              placeholder="http://localhost:3000"
                              onChange={(e) => setLocalURL(e.target.value)}
                            />
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={add}
                        disabled={!name || !publicURL || !serverId}
                      >
                        Add
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
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
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
              }
            >
              {applications.map((app) => (
                <Card
                  key={app.id}
                  className={
                    isGridLayout
                      ? "h-full flex flex-col justify-between relative"
                      : "w-full mb-4 relative"
                  }
                >
                  <CardHeader>
                    <div className="absolute top-2 right-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          app.online ? "bg-green-700" : "bg-red-700"
                        }`}
                        title={app.online ? "Online" : "Offline"}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            app.online ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-md">
                          {app.icon ? (
                            <img
                              src={app.icon}
                              alt={app.name}
                              className="w-full h-full object-contain rounded-md"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs">Image</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <CardTitle className="text-2xl font-bold">
                            {app.name}
                          </CardTitle>
                          <CardDescription className="text-md">
                            {app.description}
                            <br />
                            Server: {app.server || "No server"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-start space-y-2 w-[270px]">
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex flex-col space-y-2 flex-grow">
                            <Button
                              variant="outline"
                              className="gap-2 w-full"
                              onClick={() =>
                                window.open(app.publicURL, "_blank")
                              }
                            >
                              <Link className="h-4 w-4" />
                              Open Public URL
                            </Button>
                            {app.localURL && (
                              <Button
                                variant="outline"
                                className="gap-2 w-full"
                                onClick={() =>
                                  window.open(app.localURL, "_blank")
                                }
                              >
                                <Home className="h-4 w-4" />
                                Open Local URL
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => deleteApplication(app.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() => openEditDialog(app)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Edit Application
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <div className="space-y-4 pt-4">
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>Name</Label>
                                        <Input
                                          placeholder="e.g. Portainer"
                                          value={editName}
                                          onChange={(e) =>
                                            setEditName(e.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>Server</Label>
                                        <Select
                                          value={
                                            editServerId !== null
                                              ? String(editServerId)
                                              : undefined
                                          }
                                          onValueChange={(v) =>
                                            setEditServerId(Number(v))
                                          }
                                          required
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select server" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {servers.map((server) => (
                                              <SelectItem
                                                key={server.id}
                                                value={String(server.id)}
                                              >
                                                {server.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>
                                          Description{" "}
                                          <span className="text-stone-600">
                                            (optional)
                                          </span>
                                        </Label>
                                        <Textarea
                                          placeholder="Application description"
                                          value={editDescription}
                                          onChange={(e) =>
                                            setEditDescription(e.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>
                                          Icon URL{" "}
                                          <span className="text-stone-600">
                                            (optional)
                                          </span>
                                        </Label>
                                        <Input
                                          placeholder="https://example.com/icon.png"
                                          value={editIcon}
                                          onChange={(e) =>
                                            setEditIcon(e.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>Public URL</Label>
                                        <Input
                                          placeholder="https://example.com"
                                          value={editPublicURL}
                                          onChange={(e) =>
                                            setEditPublicURL(e.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>
                                          Local URL{" "}
                                          <span className="text-stone-600">
                                            (optional)
                                          </span>
                                        </Label>
                                        <Input
                                          placeholder="http://localhost:3000"
                                          value={editLocalURL}
                                          onChange={(e) =>
                                            setEditLocalURL(e.target.value)
                                          }
                                        />
                                      </div>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={edit}
                                    disabled={
                                      !editName || !editPublicURL || !editServerId
                                    }
                                  >
                                    Save Changes
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
  );
}
