import Link from "next/link";

export function Footer() {
  return (
    <footer className="header-blur mt-12 md:mt-16">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground body-font">
          <Link href="#" className="hover:text-sakura-primary transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-sakura-primary transition-colors">Digital Millennium Copyright Act</Link>
          <Link href="#" className="hover:text-sakura-primary transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-sakura-primary transition-colors">Report An Issue</Link>
          <Link href="#" className="hover:text-sakura-primary transition-colors">Report Billing Issue</Link>
        </div>
      </div>
    </footer>
  );
}
