-- Suporte a até 2 turnos por dia (ex.: almoço + jantar) no horário de
-- funcionamento. Converte o formato antigo por dia:
--   { "enabled": bool, "open": "HH:MM", "close": "HH:MM" }
-- para o novo, com um array de turnos:
--   { "enabled": bool, "shifts": [{ "open": "HH:MM", "close": "HH:MM" }] }
-- Idempotente: só transforma dias que ainda estão no formato antigo
-- (não têm a chave "shifts").
update public.restaurant_settings
set opening_hours = (
  select coalesce(
    jsonb_object_agg(
      key,
      case
        when value ? 'shifts' then value
        else jsonb_build_object(
          'enabled', coalesce(value->'enabled', 'false'::jsonb),
          'shifts', jsonb_build_array(
            jsonb_build_object(
              'open', coalesce(value->'open', '"00:00"'::jsonb),
              'close', coalesce(value->'close', '"00:00"'::jsonb)
            )
          )
        )
      end
    ),
    '{}'::jsonb
  )
  from jsonb_each(opening_hours)
)
where opening_hours is not null and opening_hours != '{}'::jsonb;
