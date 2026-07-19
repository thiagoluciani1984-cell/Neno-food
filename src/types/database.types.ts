/**
 * Tipos do banco de dados — espelho manual das migrations 0001–0019.
 *
 * Em desenvolvimento, regenere automaticamente a partir do schema com:
 *   npm run db:types
 * (requer Supabase CLI + projeto local em execução)
 */

// ─── Enums (0001 + 0011) ──────────────────────────────────────────────────────

export type UserRole =
  | "master_admin"
  | "restaurant"
  | "customer"
  | "driver"
  | "staff"      // membro da equipe do restaurante
  | "moderator"; // moderador da plataforma

export type RestaurantStatus = "pending" | "active" | "blocked";

export type OnboardingStatus = "draft" | "in_review" | "approved" | "rejected";

export type OrderType = "delivery" | "pickup" | "dine_in";

export type OrderStatus =
  | "payment_pending"   // aguardando confirmação de pagamento
  | "received"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "pix" | "cash" | "card" | "online";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CouponType = "percentage" | "fixed" | "free_shipping";

export type DriverStatus = "offline" | "available" | "busy";
export type DriverApprovalStatus = "pending" | "approved" | "rejected" | "suspended";

export type NotificationType = "order_update" | "promotion" | "system";

export type PostType = "photo" | "text" | "video" | "story";

export type ImageSource = "upload" | "nenos_studio";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type RefundStatus = "requested" | "approved" | "rejected" | "processed";

export type OptionType = "single" | "multiple";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "approve"
  | "reject"
  | "suspend"
  | "restore";

// ─── Core tables (0002) ───────────────────────────────────────────────────────

export interface Profile {
  id: string;
  role: UserRole;
  restaurant_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  cuisine: string;
  phone: string | null;
  email: string | null;
  status: RestaurantStatus;
  // Campos de 0012 ↓
  cnpj: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  history: string | null;
  chef_name: string | null;
  price_range: 1 | 2 | 3 | 4 | null;
  establishment_type: string;
  onboarding_status: OnboardingStatus;
  registration_step: 1 | 2 | 3 | 4;
  rejection_reason: string | null;
  avg_rating: number;
  total_reviews: number;
  total_orders: number;
  is_verified: boolean;
  approved_at: string | null;
  approved_by: string | null;
  theme_primary: string | null;
  theme_secondary: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  restaurant_id: string;
  is_open: boolean;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  accepts_dine_in: boolean;
  delivery_fee_cents: number;
  free_delivery_above_cents: number | null;
  min_order_cents: number;
  delivery_radius_km: number;
  avg_prep_minutes: number;
  opening_hours: Record<string, { open: string; close: string; enabled: boolean }>;
  payment_methods: PaymentMethod[];
  pagarme_recipient_id: string | null;
  address_street: string | null;
  address_number: string | null;
  address_district: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Restaurant: novas tabelas (0012) ─────────────────────────────────────────

export interface RestaurantStaff {
  id: string;
  restaurant_id: string;
  profile_id: string;
  job_title: string;
  permissions: string[];
  is_active: boolean;
  invited_by: string | null;
  invited_at: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantDocument {
  id: string;
  restaurant_id: string;
  doc_type: string;
  storage_path: string;
  original_name: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantFollower {
  restaurant_id: string;
  profile_id: string;
  created_at: string;
}

// ─── Catalog (0003) ───────────────────────────────────────────────────────────

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  promo_price_cents: number | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  deleted_at: string | null;
  // Campos de 0016 ↓
  is_vegetarian: boolean;
  is_vegan: boolean;
  has_gluten: boolean;
  has_lactose: boolean;
  allergens: string[];
  prep_time_minutes: number | null;
  serves: number | null;
  daily_stock_limit: number | null;
  stock_remaining: number | null;
  weight_grams: number | null;
  calories: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  type: OptionType;
  is_required: boolean;
  min_qty: number;
  max_qty: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductOptionItem {
  id: string;
  option_id: string;
  name: string;
  price_cents: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ImageLibrary {
  id: string;
  restaurant_id: string | null;
  url: string;
  thumbnail_url: string | null;
  source: ImageSource;
  category: string | null;
  tags: string[];
  is_approved: boolean;
  created_at: string;
}

// ─── Customers & Delivery (0004) ─────────────────────────────────────────────

export interface Customer {
  id: string;
  profile_id: string | null;
  full_name: string | null;
  phone: string | null;
  guest_token: string | null;
  loyalty_points: number;
  total_orders: number;
  total_spent_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  label: string;
  recipient: string | null;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  zip: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  profile_id: string;
  restaurant_id: string | null;
  vehicle_type: string;
  vehicle_plate: string | null;
  status: DriverStatus;
  is_approved: boolean;
  total_deliveries: number;
  total_earnings_cents: number;
  // Campos de 0014 ↓
  cpf: string | null;
  birth_date: string | null;
  approval_status: DriverApprovalStatus;
  rejection_reason: string | null;
  suspension_reason: string | null;
  suspended_until: string | null;
  pix_key: string | null;
  pix_key_type: "cpf" | "email" | "phone" | "random" | "cnpj" | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  current_heading: number | null;
  last_location_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverDocument {
  id: string;
  driver_id: string;
  doc_type: string;
  storage_path: string;
  original_name: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverVehicle {
  id: string;
  driver_id: string;
  type: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  plate: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverVerification {
  id: string;
  driver_id: string;
  check_type: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface DriverLocation {
  id: number;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  created_at: string;
}

// ─── Orders (0005 + 0015) ─────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  restaurant_id: string;
  code: string;
  type: CouponType;
  value_cents: number;
  value_percent: number | null;
  min_order_cents: number;
  max_discount_cents: number | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  driver_id: string | null;
  coupon_id: string | null;
  order_number: number;
  type: OrderType;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  delivery_address: DeliveryAddressSnapshot | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  discount_cents: number;
  total_cents: number;
  change_for_cents: number | null;
  confirmed_at: string | null;
  prepared_at: string | null;
  picked_up_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  rated_at: string | null;
  prep_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddressSnapshot {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  zip: string;
  reference?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  total_cents: number;
  notes: string | null;
  created_at: string;
}

export interface OrderItemOption {
  id: string;
  order_item_id: string;
  option_id: string | null;
  option_item_id: string | null;
  option_name: string;
  option_item_name: string;
  unit_price_cents: number;
  quantity: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount_cents: number;
  provider: string | null;
  provider_ref: string | null;
  provider_payload: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryTracking {
  id: number;
  order_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  created_at: string;
}

export interface DeliveryCode {
  id: string;
  order_id: string;
  code: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  expires_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// ─── Social (0013) ────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  restaurant_id: string;
  author_id: string;
  type: PostType;
  caption: string | null;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostImage {
  id: string;
  post_id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
}

export interface PostLike {
  post_id: string;
  profile_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  likes_count: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostSave {
  post_id: string;
  profile_id: string;
  created_at: string;
}

export interface PostReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  detail: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

// ─── Admin Tools (0017) ───────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  restaurant_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_addr: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  reporter_id: string;
  assigned_to: string | null;
  restaurant_id: string | null;
  ticket_type: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: "low" | "normal" | "high" | "urgent";
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface Refund {
  id: string;
  order_id: string;
  requested_by: string;
  approved_by: string | null;
  amount_cents: number;
  reason: string;
  status: RefundStatus;
  rejection_note: string | null;
  payment_ref: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Tipos compostos (joins comuns) ──────────────────────────────────────────

export interface ProductWithCategory extends Product {
  category: Pick<Category, "id" | "name" | "slug"> | null;
}

export interface ProductWithOptions extends Product {
  product_options: (ProductOption & { product_option_items: ProductOptionItem[] })[];
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { order_item_options: OrderItemOption[] })[];
}

export interface PostWithImages extends Post {
  post_images: PostImage[];
}

export interface RestaurantWithSettings extends Restaurant {
  restaurant_settings: RestaurantSettings | null;
}
