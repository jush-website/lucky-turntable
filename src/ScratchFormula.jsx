import React, { useState } from 'react';
import { Ticket, Plus, AlertTriangle } from 'lucide-react';
import { computeScratchNumbers } from './scratchFormula';

const toNumber = (value, fallback = 0) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
};

const ScratchFormula = ({ onAddToWheel, onReplaceWheel, disabled }) => {
  const [a, setA] = useState('03');
  const [b, setB] = useState('43');
  const [c, setC] = useState('91');
  const [winRate, setWinRate] = useState('30'); // 百分比，彩券背面有寫
  const [step, setStep] = useState('0.033');
  const [count, setCount] = useState('30'); // 一本大約中 30 張
  const [bookSize, setBookSize] = useState(''); // 每本張數，空白 = 不限制

  const { d, rows } = computeScratchNumbers({
    a: toNumber(a),
    b: toNumber(b),
    c: toNumber(c),
    winRate: toNumber(winRate) / 100,
    step: toNumber(step, 0.033),
    count: Math.min(Math.max(Math.floor(toNumber(count, 30)), 1), 100),
    bookSize: Math.max(Math.floor(toNumber(bookSize)), 0),
  });

  const uniqueNumbers = [...new Set(rows.map((r) => r.rounded))];
  const wheelItems = uniqueNumbers.map((n) => `${n} 號`);

  const field = (label, value, setter, props = {}) => (
    <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
      {label}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => setter(e.target.value)}
        className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800 text-sm font-medium"
        {...props}
      />
    </label>
  );

  return (
    <div className="p-6 flex flex-col h-full animate-fade-in overflow-y-auto custom-scrollbar">
      <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
        <Ticket size={20} className="text-indigo-500" />
        刮刮樂公式
      </h2>
      <p className="text-xs text-slate-400 mb-4">D = A + B + C，號碼 = D × (中獎率 + N)，N = 0.033 × 1, 2, 3…</p>

      <div className="grid grid-cols-3 gap-2 mb-2">
        {field('A', a, setA)}
        {field('B', b, setB)}
        {field('C', c, setC)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {field('中獎率 (%)', winRate, setWinRate)}
        {field('N 間距', step, setStep)}
        {field('號碼數量', count, setCount, { inputMode: 'numeric' })}
        {field('每本張數', bookSize, setBookSize, { inputMode: 'numeric', placeholder: '不限制' })}
      </div>

      <div className="mb-3 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-bold">
        D = {toNumber(a)} + {toNumber(b)} + {toNumber(c)} = {d}
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onReplaceWheel(wheelItems)}
          disabled={disabled || wheelItems.length < 2}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          用這 {wheelItems.length} 個號碼抽取
        </button>
        <button
          onClick={() => onAddToWheel(wheelItems)}
          disabled={disabled || wheelItems.length === 0}
          className="flex items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> 加入轉盤
        </button>
      </div>

      <div className="flex-1 min-h-[160px] rounded-xl border border-slate-100 overflow-y-auto custom-scrollbar">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 sticky top-0">
            <tr>
              <th className="p-2 text-left">k</th>
              <th className="p-2 text-left">中獎率 + N</th>
              <th className="p-2 text-right">D × 倍率</th>
              <th className="p-2 text-right">選號</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className="border-t border-slate-50">
                <td className="p-2 text-slate-400">{r.k}</td>
                <td className="p-2 text-slate-600">{r.multiplier.toFixed(3)}</td>
                <td className="p-2 text-right text-slate-600">{r.value.toFixed(3)}</td>
                <td className="p-2 text-right font-bold text-indigo-600">
                  {r.low === r.high ? r.low : `${r.low} 或 ${r.high}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-slate-400 flex items-start gap-1">
        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
        刮刮樂的中獎張是印製時就決定好的，這個公式無法提高中獎機率，僅供娛樂參考。
      </p>
    </div>
  );
};

export default ScratchFormula;
