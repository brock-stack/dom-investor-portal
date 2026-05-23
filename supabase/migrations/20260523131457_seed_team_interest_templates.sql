-- v2.2.9 — seed team alert templates for investor_interest submissions

insert into public.email_templates (name, api_name, subject, body_html, body_text, category, folder_id, template_type, is_active)
values (
  'New Interest — Internal Team Notification',
  'team_interest_submitted',
  'New Interest: {{investor_name}} on {{property_address}}',
  $html$<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,sans-serif">
<div style="max-width:540px;margin:40px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12)">
  <div style="background:linear-gradient(135deg,#0f1b33,#1a2744);padding:28px 36px;text-align:center">
    <img src="https://ai.directoffmarket.com/images/dom-logo-white.png" alt="Direct Off Market" style="height:36px;width:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto">
    <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:6px;text-align:center">New Interest Expressed</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.85);text-align:center;font-weight:700">{{property_address}}</div>
  </div>
  <div style="background:#fff;padding:32px 36px">
    <p style="font-size:15px;color:#374151;line-height:1.6;margin-top:0">{{investor_name}} expressed interest in this listing via the investor portal. This is a soft signal — give them a call.</p>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0">
      <p style="margin:0 0 6px;font-size:13px;color:#374151;font-weight:700">Investor</p>
      <p style="margin:0 0 6px;font-size:13px;color:#374151"><strong>Name:</strong> {{investor_name}}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#374151"><strong>Email:</strong> {{investor_email}}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#374151"><strong>Phone:</strong> {{investor_phone}}</p>
    </div>
    <div style="background:#f8f9fa;border-left:4px solid #4fc3f7;border-radius:0 8px 8px 0;padding:16px;margin:16px 0">
      <p style="margin:0 0 6px;font-size:13px;color:#374151;font-weight:700">Message</p>
      <p style="margin:0;font-size:13px;color:#374151;white-space:pre-wrap">{{message}}</p>
    </div>
    <div style="margin:28px 0;text-align:center">
      <a href="{{interest_admin_url}}" style="display:inline-block;background:#1a2744;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:.02em">Open Listing in CRM &rarr;</a>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:20px">
    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">Submitted {{submitted_at}} &mdash; Direct Off Market Investor Portal</p>
  </div>
  <div style="background:#f0f2f5;padding:16px 36px;text-align:center">
    <p style="margin:0;font-size:11px;color:#9ca3af">Direct Off Market, LLC &mdash; Sarasota, Florida</p>
  </div>
</div>
</body></html>$html$,
  $txt$New Interest — {{property_address}}

{{investor_name}} expressed interest in this listing.

Name: {{investor_name}}
Email: {{investor_email}}
Phone: {{investor_phone}}

Message: {{message}}

Submitted: {{submitted_at}}

Open in CRM: {{interest_admin_url}}$txt$,
  'internal',
  'bff032b8-c56e-4d19-bc3d-3c69a3bcb32f',
  'email',
  true
)
on conflict (api_name) do nothing;

insert into public.email_templates (name, api_name, subject, body_html, body_text, category, folder_id, template_type, is_active)
values (
  'New Interest — Team SMS Alert',
  'team_sms_interest_submitted',
  'New Interest Alert',
  null,
  'DOM Alert: New interest on {{property_address}}. From: {{investor_name}} ({{investor_phone}}). Open: {{interest_admin_url}}',
  'internal',
  'bff032b8-c56e-4d19-bc3d-3c69a3bcb32f',
  'sms',
  true
)
on conflict (api_name) do nothing;
