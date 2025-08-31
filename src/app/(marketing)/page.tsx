import { AnimatedBackground } from "~/components/visuals/AnimatedBackground";
import { Hero } from "~/components/marketing/Hero";
import { Features } from "~/components/marketing/Features";
import { Pricing } from "~/components/marketing/Pricing";

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      <Features />
      
      {/* Pricing Section */}
      <Pricing />
      
      {/* Footer */}
      <footer className="relative z-10 bg-background border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                سيراج
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                منصة الذكاء الاصطناعي الرائدة للغة العربية. أنشئ، حلل، وأتمت المحتوى بذكاء.
              </p>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs">X</span>
                </div>
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs">LI</span>
                </div>
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs">GH</span>
                </div>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">المنتج</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">المميزات</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">الأسعار</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">التكامل</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">الدعم</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">المركز المساعدة</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">الدعم الفني</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">المجتمع</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">الاتصال</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 سيراج. جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-foreground transition-colors">شروط الاستخدام</a>
              <a href="#" className="hover:text-foreground transition-colors">ملفات تعريف الارتباط</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
