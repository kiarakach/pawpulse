import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Proactive Notification module — invoked twice daily by scheduled workflows.
// kind: "allergy" (11am) or "diet" (8pm). Generates AI content per user's pets
// and sends a native push notification to each user with pets.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Guard direct HTTP calls: if a caller token is present, require admin.
    // Scheduled workflow invocations carry no user token and are allowed.
    let caller = null;
    try { caller = await base44.auth.me(); } catch (e) { /* scheduled path */ }
    if (caller && caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const kind = body?.kind === 'diet' ? 'diet' : 'allergy';

    const service = base44.asServiceRole;
    const users = await service.entities.User.list('-created_date', 200);
    const today = new Date().toISOString().slice(0, 10);
    const results = { kind, sent: 0, skipped: 0, errors: [] as string[] };

    for (const user of users) {
      let step = 'load_pets';
      try {
        const pets = await service.entities.Pet.filter({ created_by_id: user.id }, 'created_date', 20);
        if (!pets.length) { results.skipped++; continue; }
        step = 'llm';

        const petList = pets
          .map((p) => `${p.name} (${p.species}, breed: ${p.breed || 'unknown'}, age: ${p.age || 'unknown'})`)
          .join('; ');
        const names = pets.map((p) => p.name).join(' & ');

        let title = '';
        let content = '';

        if (kind === 'allergy') {
          const res = await service.integrations.Core.InvokeLLM({
            prompt: `Today is ${today}. A pet owner's pets: ${petList}. Write one short mid-day seasonal allergy alert for the owner. Cover today's realistic seasonal/environmental allergy risks for these species and breeds at this time of year (pollen, mold, grass, fleas), and one quick protective action the owner can take today. Warm, playful, max 220 characters, plain text only.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: 'object',
              properties: { alert: { type: 'string' } },
              required: ['alert']
            }
          });
          title = `Today's Allergy Alerts for ${names}`.slice(0, 100);
          content = (res?.alert || 'Check your pet dashboard for today’s seasonal allergy tips.').slice(0, 200);
        } else {
          const res = await service.integrations.Core.InvokeLLM({
            prompt: `Today is ${today}. A pet owner's pets: ${petList}. Write one short evening diet digest for the owner: today's diet tip tailored to each pet's species, breed and age — a portion, hydration, treat or safe-food tip, or a gentle evening feeding-routine nudge. Warm, playful, max 220 characters, plain text only.`,
            response_json_schema: {
              type: 'object',
              properties: { digest: { type: 'string' } },
              required: ['digest']
            }
          });
          title = 'Today\'s Diet Digest';
          content = (res?.digest || 'A balanced evening meal and fresh water keep tails wagging.').slice(0, 200);
        }

        step = 'push';
        await service.integrations.Core.SendPushNotification({
          user_id: user.id,
          title,
          content,
          action_label: 'Open PawPulse',
          action_url: kind === 'allergy' ? '/health' : '/diet'
        });
        results.sent++;
      } catch (err) {
        results.errors.push(`${user.id} [${step}]: ${err.message}`);
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}