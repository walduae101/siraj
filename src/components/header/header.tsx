"use client";

import {
  DiscordLogoIcon,
  HouseIcon,
  ListIcon,
  ShoppingBagIcon,
  SignInIcon,
  SignOutIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { clientEnv } from "~/env-client";
import { useAuthDialog } from "~/stores/useAuthDialog";
import { useCartSidebar } from "~/stores/useCartSidebar";
import { api } from "~/trpc/react";

const navItems = [
  { href: "/", icon: HouseIcon, label: "الرئيسية" },
  { href: "/tools", icon: HouseIcon, label: "الأدوات" },
  {
    href: clientEnv.NEXT_PUBLIC_DISCORD_INVITE_URL,
    icon: DiscordLogoIcon,
    label: "ديسكورد",
  },
];

export default function Header() {
  const { data: auth } = api.paynow.getAuth.useQuery(undefined, {
    staleTime: 30_000, // Cache auth state for 30 seconds
  });
  const router = useRouter();

  const authDialog = useAuthDialog();
  const cartSidebar = useCartSidebar();
  const logout = api.paynow.logout.useMutation({
    onSuccess: () => {
      router.push("/");
    },
  });

  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSheetItemClick = () => {
    setSheetOpen(false);
  };

  return (
    <header className="w-full p-4 py-6 transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" size="sm" asChild>
              <Link href={item.href} className="flex items-center gap-2">
                <item.icon
                  weight="bold"
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {auth ? (
            <div className="hidden items-center gap-2 md:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                aria-label="Go to dashboard"
              >
                <UserIcon
                  weight="bold"
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
                <span>لوحة التحكم</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout.mutate()}
                aria-label="Logout"
              >
                <SignOutIcon
                  weight="bold"
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
                <span>تسجيل الخروج</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => authDialog.setOpen(true)}
              className="hidden md:flex"
              aria-label="Open login dialog"
            >
              <SignInIcon
                weight="bold"
                width={20}
                height={20}
                aria-hidden="true"
              />
              <span>تسجيل الدخول</span>
            </Button>
          )}

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <ListIcon
                  weight="bold"
                  className="h-8! w-8!"
                  aria-hidden="true"
                />
              </Button>
            </SheetTrigger>

            <SheetTitle className="hidden" />

            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav
                className="mt-6 flex flex-col gap-4 px-4"
                aria-label="Mobile navigation"
              >
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="sm"
                    asChild
                    className="justify-start"
                    onClick={handleSheetItemClick}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon
                        weight="bold"
                        width={20}
                        height={20}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </Link>
                  </Button>
                ))}

                {auth ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        router.push("/dashboard");
                        handleSheetItemClick();
                      }}
                      className="justify-start"
                      aria-label="Go to dashboard"
                    >
                      <UserIcon
                        weight="bold"
                        width={20}
                        height={20}
                        aria-hidden="true"
                      />
                      <span>لوحة التحكم</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        logout.mutate();
                        handleSheetItemClick();
                      }}
                      className="justify-start"
                      aria-label="Logout"
                    >
                      <SignOutIcon
                        weight="bold"
                        width={20}
                        height={20}
                        aria-hidden="true"
                      />
                      <span>تسجيل الخروج</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      authDialog.setOpen(true);
                      handleSheetItemClick();
                    }}
                    className="justify-start"
                    aria-label="Open login dialog"
                  >
                    <SignInIcon
                      weight="bold"
                      width={20}
                      height={20}
                      aria-hidden="true"
                    />
                    <span>تسجيل الدخول</span>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
