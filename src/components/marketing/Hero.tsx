"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Target } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background-secondary" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-start"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">أحدث منصة ذكاء اصطناعي للغة العربية</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
              >
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  سيراج
                </span>
                <br />
                <span className="text-foreground">
                  منصة الذكاء الاصطناعي
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0"
              >
                أنشئ محتوى عربي ذكي، حلل البيانات، وأتمت العمليات باستخدام أحدث تقنيات الذكاء الاصطناعي
              </motion.p>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap gap-4 mb-8 justify-center lg:justify-start"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>سرعة فائقة</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4 text-accent" />
                  <span>دقة عالية</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>ذكاء اصطناعي متقدم</span>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold shadow-glow hover:shadow-glow-lg transition-all duration-300"
                >
                  <span>ابدأ الآن</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-background-secondary text-foreground rounded-2xl font-semibold border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <span>عرض الأسعار</span>
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex justify-center lg:justify-start gap-8 mt-12 text-sm text-muted-foreground"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">10K+</div>
                  <div>مستخدم نشط</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">99.9%</div>
                  <div>وقت تشغيل</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">24/7</div>
                  <div>دعم فني</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              {/* Floating Card */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative bg-card border border-border rounded-3xl p-8 shadow-soft-glow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </div>
                <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-primary">جاري المعالجة...</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    تحليل المحتوى العربي باستخدام الذكاء الاصطناعي
                  </div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute -top-4 -right-4 w-16 h-16 bg-accent/20 rounded-full blur-sm"
              />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary/20 rounded-full blur-sm"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
