import { AppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Nav } from "@/types/nav";
import User from "@/components/user";
import { useContext } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const { user } = useContext(AppContext);

  const navigations: Nav[] = [
    { name: "pricing", title: "价格", url: "/pricing", target: "_self" },
    {
      name: "gallery",
      title: "作品展示",
      url: "/gallery",
      target: "_self",
    },
  ];

  return (
    <header>
      <div className="h-auto w-screen">
        <nav className="font-inter mx-auto h-auto w-full max-w-[1600px] lg:relative lg:top-0">
          <div className="flex flex-row items-center px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-8 xl:px-20">
            <Link href="/" className="text-xl font-medium flex items-center">
              <Image
                src="/logo.png"
                width={32}
                height={32}
                className="rounded-full mr-2"
                alt="AICollager Logo"
              />
              <span className="font-bold text-primary text-2xl">
                AICollager
              </span>
            </Link>

            <div className="hidden md:flex ml-16">
              {navigations.map((tab: Nav, idx: number) => (
                <Link
                  className="text-md font-normal leading-6 text-gray-800 mx-4"
                  key={idx}
                  href={tab.url ?? "/"}
                >
                  {tab.title}
                </Link>
              ))}
            </div>

            <div className="flex-1"></div>

            <div className="flex flex-row items-center lg:flex lg:flex-row lg:space-x-3 lg:space-y-0">
              <div className="hidden md:block mr-4">{/* <Social /> */}</div>

              {user === undefined ? (
                <>loading...</>
              ) : (
                <>
                  {user ? (
                    <>
                      {user.credits !== undefined && (
                        <Link
                          href="/pricing"
                          className="hidden md:block mr-8 font-normal text-gray-800 cursor-pointer"
                        >
                          额度:{" "}
                          <span className="text-primary">
                            {user.credits}
                          </span>
                        </Link>
                      )}

                      <User user={user} />
                    </>
                  ) : (
                    <Link className="cursor-pointer" href="/sign-in">
                      <Button>登录</Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
