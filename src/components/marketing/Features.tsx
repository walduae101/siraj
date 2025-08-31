"use client";

import { motion } from "framer-motion";
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Zap, 
  Shield, 
  Globe,
  FileText,
  Users,
  Settings,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "ذكاء اصطناعي متقدم",
    description: "أحدث نماذج الذكاء الاصطناعي لتحليل وفهم المحتوى العربي بدقة عالية",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: MessageSquare,
    title: "إنشاء محتوى ذكي",
    description: "أنشئ مقالات، تقارير، ومحتوى تسويقي عالي الجودة باللغة العربية",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: BarChart3,
    title: "تحليل البيانات",
    description: "حلل البيانات والنصوص العربية واستخرج الرؤى والأنماط المهمة",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Zap,
    title: "سرعة فائقة",
    description: "معالجة فورية للمحتوى مع استجابة سريعة ووقت انتظار منخفض",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Shield,
    title: "أمان وحماية",
    description: "حماية متقدمة للبيانات مع تشفير كامل وامتثال لمعايير الأمان العالمية",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Globe,
    title: "دعم متعدد اللغات",
    description: "دعم شامل للغة العربية مع إمكانية التكامل مع لغات أخرى",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-background-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">المميزات الأساسية</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            كل ما تحتاجه في
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}منصة واحدة
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-muted-foreground"
          >
            منصة شاملة تجمع بين أحدث تقنيات الذكاء الاصطناعي وأدوات تحليل البيانات
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group relative p-8 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold mb-2">معالجة النصوص</h4>
            <p className="text-muted-foreground text-sm">
              تحليل وتلخيص وتصنيف النصوص العربية
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 text-accent mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold mb-2">تعاون الفريق</h4>
            <p className="text-muted-foreground text-sm">
              أدوات تعاون متقدمة للفرق والمؤسسات
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 mb-4">
              <Settings className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold mb-2">تخصيص متقدم</h4>
            <p className="text-muted-foreground text-sm">
              خيارات تخصيص شاملة لاحتياجاتك
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
