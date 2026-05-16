import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const target = new Date();
  target.setDate(target.getDate() + 3);
  const dueDay = target.getDate();

  const { data: tenancies } = await supabase
    .from("tenancies")
    .select("*, users!tenant_id(email, name)")
    .eq("due_day", dueDay)
    .eq("status", "active");

  for (const t of tenancies ?? []) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RentSync <reminders@rentsync.in>",
        to: t.users.email,
        subject: `Rent due in 3 days — ₹${t.rent_amount}`,
        html: `<p>Hi ${t.users.name}, your rent of ₹${t.rent_amount} is due on the ${t.due_day}th.</p>`,
      }),
    });
  }

  return new Response("ok");
});
