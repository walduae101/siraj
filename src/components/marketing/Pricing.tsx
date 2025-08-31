"use client";

import { motion } from "framer-motion";
import { Check, Star, Zap, Crown } from "lucide-react";

const plans = [
  {
    name: "مجاني",
    price: "0",
    period: "شهرياً",
    description: "مثالي للبداية والتعرف على المنصة",
    features: [
      "1000 كلمة شهرياً",
      "الوصول الأساسي للذكاء الاصطناعي",
      "دعم المجتمع",
      "التصدير الأساسي",
    ],
    popular: false,
    icon: Zap,
    color: "border-muted",
    bgColor: "bg-card",
  },
  {
    name: "احترافي",
    price: "29",
    period: "شهرياً",
    description: "للأفراد والمشاريع الصغيرة",
    features: [
      "100,000 كلمة شهرياً",
      "جميع ميزات الذكاء الاصطناعي",
      "دعم فني مخصص",
      "تصدير متقدم",
      "تحليل البيانات",
      "التخصيص المتقدم",
    ],
    popular: true,
    icon: Star,
    color: "border-primary",
    bgColor: "bg-gradient-to-br from-card to-primary/5",
  },
  {
    name: "مؤسسات",
    price: "99",
    period: "شهرياً",
    description: "للشركات والفرق الكبيرة",
    features: [
      "كلمات غير محدودة",
      "جميع الميزات المتقدمة",
      "دعم فني 24/7",
      "API مخصص",
      "إدارة الفريق",
      "تقارير متقدمة",
      "تكامل مع الأنظمة",
      "تدريب مخصص",
    ],
    popular: false,
    icon: Crown,
    color: "border-accent",
    bgColor: "bg-gradient-to-br from-card to-accent/5",
  },
];

export function Pricing() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6"
          >
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">خطط الأسعار</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            اختر الخطة
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}المناسبة لك
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-muted-foreground mb-8"
          >
            خطط مرنة تناسب جميع احتياجاتك، من الأفراد إلى المؤسسات الكبيرة
          </motion.p>

          {/* Yearly Discount Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent/10 border border-accent/20 text-accent mb-8"
          >
            <span className="text-sm font-semibold">خصم 20% للاشتراك السنوي</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className={`relative p-8 rounded-2xl border-2 ${plan.color} ${plan.bgColor} transition-all duration-300 ${
                plan.popular ? "ring-2 ring-primary/20 shadow-glow" : ""
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    <Star className="w-4 h-4" />
                    الأكثر شعبية
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  plan.popular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <plan.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  {plan.price !== "0" && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ${Math.round(parseInt(plan.price) * 0.8)}/شهرياً مع الاشتراك السنوي
                    </p>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {plan.price === "0" ? "ابدأ مجاناً" : "اختر الخطة"}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            جميع الخطط تشمل دعم فني مجاني وضمان استرداد الأموال خلال 30 يوماً
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>لا توجد رسوم إعداد</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>إلغاء في أي وقت</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>تحديثات مجانية</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
