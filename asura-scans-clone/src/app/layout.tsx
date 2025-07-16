import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ComicsProvider } from "@/lib/comics-context";

export const metadata: Metadata = {
  title: "SakuraScans - Read Manga & Manhwa Online",
  description: "Read the latest manga and manhwa chapters for free on SakuraScans. Join our community of readers and discover new series.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ComicsProvider>
            {children}
          </ComicsProvider>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              let scrollTimeout;
              let isScrolling = false;

              function hideScrollbar() {
                document.documentElement.style.setProperty('scrollbar-color', 'transparent transparent');
                const thumbs = document.querySelectorAll('::-webkit-scrollbar-thumb');
                document.documentElement.style.setProperty('--scrollbar-opacity', '0.1');
              }

              function showScrollbar() {
                document.documentElement.style.setProperty('scrollbar-color', 'hsl(335 85% 65%) transparent');
                document.documentElement.style.setProperty('--scrollbar-opacity', '1');
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(hideScrollbar, 3000);
              }

              // Show scrollbar on scroll
              window.addEventListener('scroll', showScrollbar, { passive: true });

              // Show scrollbar on mouse move near edge
              window.addEventListener('mousemove', function(e) {
                if (e.clientX > window.innerWidth - 50) {
                  showScrollbar();
                }
              }, { passive: true });

              // Initial hide after 3 seconds
              setTimeout(hideScrollbar, 3000);
            `,
          }}
        />
      </body>
    </html>
  );
}
