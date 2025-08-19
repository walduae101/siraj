import { DiscordLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Separator } from "~/components/ui/separator";
import { clientEnv } from "~/env-client";

const USEFUL_LINKS = [
  {
    name: "Discord",
    href: clientEnv.NEXT_PUBLIC_DISCORD_INVITE_URL,
    target: "_blank",
    rel: "noreferrer",
  },
  {
    name: "User Agreement",
    href: "https://paynow.gg/user-agreement",
    target: "_blank",
    rel: "noreferrer",
  },
  {
    name: "Terms Of Use",
    href: "https://paynow.gg/terms-of-use",
    target: "_blank",
    rel: "noreferrer",
  },
  {
    name: "Privacy Policy",
    href: "https://paynow.gg/privacy-policy",
    target: "_blank",
    rel: "noreferrer",
  },
];

const Footer = () => {
  return (
    <div className="mt-32 flex flex-col border-t bg-card shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)]">
      <footer>
        <div className="mx-auto max-w-screen-xl">
          <div className="grid grid-cols-1 gap-x-16 gap-y-10 px-6 py-12 md:grid-cols-3 xl:px-0">
            <div>
              <h6>من نحن</h6>

              <p className="mt-4 text-muted-foreground text-sm">
                سِراج — نور رقمي يفتح نوافذ الفهم ويزرع الطمأنينة، رفيق يومي
                يقودك إلى قرارات أهدأ وحياة أكثر اتزانًا.
              </p>
            </div>

            <div>
              <h6>روابط مفيدة</h6>

              <ul className="mt-4 space-y-2 text-sm">
                {USEFUL_LINKS.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      target={link.target}
                      rel={link.rel}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h6>تواصل معنا</h6>

              <p className="mt-4 text-muted-foreground text-sm">
                لأي استفسار أو مساعدة، تواصل معنا عبر ديسكورد.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col-reverse items-center justify-between gap-x-2 gap-y-5 px-6 py-8 sm:flex-row xl:px-0">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                © جميع الحقوق محفوظة — سِراج siraj.life
              </span>
            </div>

            <div className="flex items-center gap-5 text-muted-foreground">
              <Link
                href={clientEnv.NEXT_PUBLIC_DISCORD_INVITE_URL}
                target="_blank"
              >
                <DiscordLogoIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
