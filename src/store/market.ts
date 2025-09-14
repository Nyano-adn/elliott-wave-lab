import { create } from 'zustand';

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number; };
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type Pair = 'BTCUSDT' | 'ETHUSDT';

type MarketState = {
  pair: Pair;
  timeframe: Timeframe;
  candles: Candle[];
  ws?: WebSocket;
  connect: (p?: Pair, tf?: Timeframe) => void;
  setPair: (p: Pair) => void;
  setTimeframe: (tf: Timeframe) => void;
};

const binanceStream = (pair: Pair, tf: Timeframe) => `wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@kline_${tf}`;

export const useMarketStore = create<MarketState>((set, get) => ({
  pair: 'BTCUSDT',
  timeframe: '1m',
  candles: [],
  connect: (p, tf) => {
    const pair = p ?? get().pair;
    const timeframe = tf ?? get().timeframe;
    // close previous
    get().ws?.close();
    const ws = new WebSocket(binanceStream(pair, timeframe));
    ws.onopen = () => {
      // ok
    };
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (!data.k) return;
      const k = data.k; // kline
      const t = Math.floor(k.t / 1000);
      set(state => {
        const arr = [...state.candles];
        const idx = arr.findIndex(c => c.t === t);
        const candle = { t, o: +k.o, h: +k.h, l: +k.l, c: +k.c, v: +k.v };
        if (idx >= 0) arr[idx] = candle;
        else arr.push(candle);
        if (arr.length > 2000) arr.shift();
        return { candles: arr };
      });
    };
    ws.onclose = () => {
      // try to reconnect after 3s
      setTimeout(() => {
        if (get().pair === pair && get().timeframe === timeframe) get().connect();
      }, 3000);
    };
    set({ ws });
  },
  setPair: (p) => set({ pair: p }),
  setTimeframe: (tf) => set({ timeframe: tf })
}));
