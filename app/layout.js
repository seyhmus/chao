import "./globals.css";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import NavBar from "@/components/NavBar";
import { MessagingProvider } from "@/context/MessageContext";
import { Inspiration } from "next/font/google";

const inspiration = Inspiration({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-inspiration",
  display: "swap",
  preload: true,
  family: "Inspiration",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: "no",
};

export const metadata = {
  title: "Chao Secure Chat",
  description:
    "Real-Time Secure Chat using WebSockets/Pusher, Firebase. Built with Next.js, Radix UI, and Firebase.",
  keywords: "pusher, firebase, chat",
  openGraph: {
    title: "Chao Secure Chat",
    description:
      "Real-Time Secure Chat using WebSockets/Pusher, Firebase. Built with Next.js, Radix UI, and Firebase.",
    keywords: "pusher, firebase, chat",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`overflow-hidden ${inspiration.variable}`}>
      <body>
        <Theme
          accentColor="amber"
          grayColor="sand"
          radius="medium"
          scaling="95%"
          appearance="dark"
        >
          <MessagingProvider>
            <header>
              <NavBar />
            </header>

            <main className="flex-1 flex relative overflow-hidden">
              {children}
            </main>

            <footer className="flex-shrink-0"></footer>
          </MessagingProvider>
        </Theme>
      </body>
    </html>
  );
}
