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
import { Plus, Link, Home } from "lucide-react" // Importiere Icons
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

export default function Dashboard() {
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
                  <BreadcrumbPage>Customization</BreadcrumbPage>
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
          <div className="flex justify-between">
            <span className="text-2xl font-semibold">Your Applications</span>
            <Button variant="outline" size="icon">
              <Plus />
            </Button>
          </div>
          <br />
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div className="bg-gray-300 w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-md">
                    <span className="text-gray-500 text-xs">Image</span>
                  </div>
                  <div className="ml-4">
                    <CardTitle>Project Name</CardTitle>
                    <CardDescription>Project Name Description</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-start space-y-2 w-[250px]">
                    <Button variant="outline" className="gap-2 w-full">
                        <Link className="h-4 w-4" />
                        Open Public URL
                    </Button>
                    <Button variant="outline" className="gap-2 w-full">
                        <Home className="h-4 w-4" />
                        Open Local URL
                    </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Pagination>
            <PaginationContent>
                <PaginationItem>
                <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                <PaginationNext href="#" />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
