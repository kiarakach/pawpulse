import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 100) : '';
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 200) : '';
    if (!title || !content) {
      return Response.json({ error: 'title and content are required' }, { status: 400 });
    }

    // Service-role push — the platform delivers natively to iPhone and Android
    await base44.asServiceRole.integrations.Core.SendPushNotification({
      user_id: user.id,
      title,
      content,
      action_label: 'Open PawPulse',
      action_url: '/health'
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}