/**
 * Contratos de repositório (PORTS da Clean Architecture).
 *
 * O domínio depende destas interfaces; a infraestrutura (Supabase) fornece
 * implementações concretas. Isso mantém as regras de negócio independentes
 * do provedor de dados e facilita testes com mocks.
 */
import type {
  Category,
  Product,
  Order,
  OrderItem,
  OrderStatus,
} from "@/types/database.types";

export interface CategoryRepository {
  listByRestaurant(restaurantId: string): Promise<Category[]>;
  create(input: Partial<Category>): Promise<Category>;
  update(id: string, input: Partial<Category>): Promise<Category>;
  softDelete(id: string): Promise<void>;
}

export interface ProductRepository {
  listByRestaurant(restaurantId: string): Promise<Product[]>;
  listAvailable(restaurantId: string): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(input: Partial<Product>): Promise<Product>;
  update(id: string, input: Partial<Product>): Promise<Product>;
  softDelete(id: string): Promise<void>;
}

export interface OrderRepository {
  listByRestaurant(restaurantId: string, statuses?: OrderStatus[]): Promise<Order[]>;
  getWithItems(id: string): Promise<(Order & { order_items: OrderItem[] }) | null>;
  create(order: Partial<Order>, items: Partial<OrderItem>[]): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}
