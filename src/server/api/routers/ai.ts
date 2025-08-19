import OpenAI from "openai";
import { z } from "zod";
import { env } from "~/env-server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

function getOpenAI() {
  const key = env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey: key });
}

export const aiRouter = createTRPCRouter({
  // Placeholder endpoints; implement business logic later
  summarize: publicProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { text } = input;
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Summarize the user's Arabic text." },
          { role: "user", content: text },
        ],
      });
      return completion.choices[0]?.message?.content ?? "";
    }),

  nurAlaNur: publicProcedure
    .input(z.object({ question: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "أنت أداة تفسير عربية تقدم شرحًا تحليليًا متسلسلًا للنصوص والأسئلة المتعلقة بالقرآن، بأسلوب عربي فصيح ومقنع.",
          },
          { role: "user", content: input.question },
        ],
      });
      return completion.choices[0]?.message?.content ?? "";
    }),

  dreamInterpreter: publicProcedure
    .input(z.object({ dream: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "قدّم قراءة تفسيرية حذرة للرؤيا بالعربية، واطلب تفاصيل إضافية إن لزم، مع الإشارة إلى أن التفسير تقريبي.",
          },
          { role: "user", content: input.dream },
        ],
      });
      return completion.choices[0]?.message?.content ?? "";
    }),

  factCheck: publicProcedure
    .input(z.object({ claim: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "تحقق من الادعاء بالعربية بإيجاز ومنهجية واضحة (صحيح/خطأ/غير قابل للتحقق) واذكر أسباب الحكم بإيجاز.",
          },
          { role: "user", content: input.claim },
        ],
      });
      return completion.choices[0]?.message?.content ?? "";
    }),
});
