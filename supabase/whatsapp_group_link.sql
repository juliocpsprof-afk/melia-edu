-- Execute uma vez no SQL Editor do Supabase.

alter table public.classes
add column if not exists whatsapp_group_link text;

comment on column public.classes.whatsapp_group_link is
'Link do grupo de WhatsApp usado nos relatórios de frequência e mensagens de aniversário.';

notify pgrst, 'reload schema';
