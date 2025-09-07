"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

export default function ToolsPage() {
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");

  const nurMutation = api.ai.nurAlaNur.useMutation();
  const dreamMutation = api.ai.dreamInterpreter.useMutation();
  const factMutation = api.ai.factCheck.useMutation();

  return (
    <div className="space-y-8 p-4">
      <section className="space-y-2">
        <h2 className="font-bold text-xl">نور على نور</h2>
        <div className="flex gap-2">
          <Input
            placeholder="اكتب سؤالك"
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
          />
          <Button
            onClick={() => nurMutation.mutate({ question: q1 })}
            disabled={!q1.trim()}
          >
            إرسال
          </Button>
        </div>
        {nurMutation.data && (
          <div className="mt-2 whitespace-pre-wrap text-sm">
            {nurMutation.data}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-xl">مفسر الأحلام</h2>
        <div className="flex gap-2">
          <Input
            placeholder="اكتب رؤياك"
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
          />
          <Button
            onClick={() => dreamMutation.mutate({ dream: q2 })}
            disabled={!q2.trim()}
          >
            إرسال
          </Button>
        </div>
        {dreamMutation.data && (
          <div className="mt-2 whitespace-pre-wrap text-sm">
            {dreamMutation.data}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-xl">مدقق الحقائق</h2>
        <div className="flex gap-2">
          <Input
            placeholder="اكتب الادعاء"
            value={q3}
            onChange={(e) => setQ3(e.target.value)}
          />
          <Button
            onClick={() => factMutation.mutate({ claim: q3 })}
            disabled={!q3.trim()}
          >
            إرسال
          </Button>
        </div>
        {factMutation.data && (
          <div className="mt-2 whitespace-pre-wrap text-sm">
            {factMutation.data}
          </div>
        )}
      </section>
    </div>
  );
}

