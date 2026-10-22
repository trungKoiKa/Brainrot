// d3-force-3d không kèm kiểu TypeScript — khai báo tối thiểu cho phần đang dùng (lực hút về tâm).
declare module "d3-force-3d" {
  interface PositionForce {
    (alpha: number): void;
    initialize?: (nodes: object[], ...args: unknown[]) => void;
    strength(s: number): PositionForce;
    [key: string]: unknown;
  }
  export function forceX(x?: number): PositionForce;
  export function forceY(y?: number): PositionForce;
  export function forceZ(z?: number): PositionForce;
}
