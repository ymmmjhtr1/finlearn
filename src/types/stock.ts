export interface Stock {
  code: string;
  name: string;
  sector: string;
  /** Yahoo Finance 티커 */
  ticker: string;
}

export interface Holding {
  code: string;
  quantity: number;
  avgPrice: number;
}
