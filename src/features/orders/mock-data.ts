import type { OrderListItem } from "./types";

export interface MockOrderLine {
  name: string;
  quantity: number;
  price: number;
}

export interface MockOrder extends OrderListItem {
  reference: string;
  customer: string;
  email: string;
  shippingAddress: string;
  payment: string;
  items: MockOrderLine[];
}

/** Deliberately labeled sample records for the frontend mockup. */
export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "ord-2048",
    reference: "ORD-2048",
    customer: "Linh Tran",
    email: "linh.tran@example.com",
    shippingAddress: "18 Nguyen Hue, District 1, Ho Chi Minh City",
    itemsCount: 3,
    total: 284,
    status: "processing",
    placedAt: "2026-09-19",
    payment: "Paid by card",
    items: [
      { name: "Cloudline Pendant", quantity: 1, price: 129 },
      { name: "Linen Shade Set", quantity: 2, price: 62 },
    ],
  },
  {
    id: "ord-2047",
    reference: "ORD-2047",
    customer: "Minh Pham",
    email: "minh.pham@example.com",
    shippingAddress: "72 Le Loi, District 1, Ho Chi Minh City",
    itemsCount: 1,
    total: 246,
    status: "completed",
    placedAt: "2026-09-18",
    payment: "Paid by card",
    items: [{ name: "Arc Floor Light", quantity: 1, price: 246 }],
  },
  {
    id: "ord-2046",
    reference: "ORD-2046",
    customer: "Quynh Nguyen",
    email: "quynh.nguyen@example.com",
    shippingAddress: "5 Tran Hung Dao, Hai Chau, Da Nang",
    itemsCount: 2,
    total: 272,
    status: "pending",
    placedAt: "2026-09-17",
    payment: "Awaiting payment",
    items: [
      { name: "Cinder Table Lamp", quantity: 2, price: 84 },
      { name: "Linen Shade Set", quantity: 1, price: 62 },
    ],
  },
  {
    id: "ord-2045",
    reference: "ORD-2045",
    customer: "Bao Le",
    email: "bao.le@example.com",
    shippingAddress: "30 Vo Thi Sau, District 3, Ho Chi Minh City",
    itemsCount: 1,
    total: 188,
    status: "cancelled",
    placedAt: "2026-09-15",
    payment: "Refunded to card",
    items: [{ name: "Lantern No. 4", quantity: 1, price: 188 }],
  },
  {
    id: "ord-2044",
    reference: "ORD-2044",
    customer: "An Do",
    email: "an.do@example.com",
    shippingAddress: "11 Phan Chu Trinh, Hoi An",
    itemsCount: 2,
    total: 240,
    status: "processing",
    placedAt: "2026-09-14",
    payment: "Paid by card",
    items: [
      { name: "Shoji Wall Sconce", quantity: 1, price: 156 },
      { name: "Linen Shade Set", quantity: 1, price: 62 },
    ],
  },
];
