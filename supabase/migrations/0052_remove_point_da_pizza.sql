-- Desativa o Point da Pizza sem apagar pedidos, clientes ou registros históricos.
update public.restaurants
set status = 'blocked',
    updated_at = now()
where slug = 'poit-da-pizza';
