-- Create new shipment_tracking table with order-centric schema
-- This replaces the existing shipment_tracking table

DROP TABLE IF EXISTS shipment_tracking CASCADE;

create table public.shipment_tracking (
  id uuid not null default extensions.uuid_generate_v4 (),
  order_id uuid not null,
  lr_number character varying(50) not null,
  transporter_name character varying(100) null,
  tracking_data jsonb null,
  last_status character varying(255) null,
  current_location character varying(255) null,
  destination character varying(255) null,
  booking_date timestamp without time zone null,
  expected_delivery_date timestamp without time zone null,
  actual_delivery_date timestamp without time zone null,
  last_checked_at timestamp without time zone null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint shipment_tracking_pkey primary key (id),
  constraint shipment_tracking_order_id_key unique (order_id),
  constraint shipment_tracking_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_shipment_tracking_lr_number on public.shipment_tracking using btree (lr_number) TABLESPACE pg_default;

create index IF not exists idx_shipment_tracking_order_id on public.shipment_tracking using btree (order_id) TABLESPACE pg_default;