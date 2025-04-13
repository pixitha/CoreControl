import * as React from "react"
import Image from "next/image"
import { AppWindow, Settings, LayoutDashboardIcon, Briefcase, Server, Network } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

// Typdefinitionen
interface NavItem {
  title: string
  icon?: React.ComponentType<any>
  url: string
  isActive?: boolean
  items?: NavItem[]
}

const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "Dashboard",
      icon: LayoutDashboardIcon,
      url: "/dashboard"
    },
    {
      title: "My Infrastructure",
      url: "#",
      icon: Briefcase,
      items: [
        {
          title: "Servers",
          icon: Server,
          url: "/dashboard/servers",
        },
        {
          title: "Applications",
          icon: AppWindow,
          url: "/dashboard/applications",
        },
        {
          title: "Network",
          icon: Network,
          url: "/dashboard/network",
        },          
      ],
    },
    {
      title: "Settings",
      icon: Settings,
      url: "/dashboard/settings",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  
  const logout = async () => {
    Cookies.remove('token')
    router.push("/")
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="https://github.com/crocofied/corecontrol">
                <Image src="/logo.png" width={48} height={48} alt="Logo"/>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">CoreControl</span>
                  <span className="">v0.0.1</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup className="flex-grow">
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url} className="font-medium">
                    {item.icon && <item.icon className="mr-2" />}
                    {item.title}
                  </Link>
                </SidebarMenuButton>
                {item.items?.length && (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild 
                          isActive={subItem.isActive ?? false}
                        >
                          <Link href={subItem.url}>
                            {subItem.icon && <subItem.icon className="mr-2" />}
                            {subItem.title}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <div className="p-4">
          <Button variant="destructive" className="w-full" onClick={logout}>
            Logout
          </Button>
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}