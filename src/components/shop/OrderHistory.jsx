import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, Trash2, Plus, Truck, PackageCheck, CircleCheck } from 'lucide-react';

const STEPS = [
  { key: 'placed', label: 'Ordered', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck }
];

const nextStatus = { placed: 'shipped', shipped: 'delivered' };

export default function OrderHistory() {
  const [orders, setOrders] = useState(null);
  const [name, setName] = useState('');
  const [store, setStore] = useState('Amazon');
  const [total, setTotal] = useState('');
  const [tracking, setTracking] = useState('');

  const load = async () => setOrders(await base44.entities.Order.list('-created_date', 50));

  useEffect(() => {
    load();
    const unsub = base44.entities.Order.subscribe(() => load());
    return unsub;
  }, []);

  const addOrder = async (e) => {
    e.preventDefault();
    if (!name.trim() || !total) return;
    await base44.entities.Order.create({
      item_name: name.trim(),
      store: store.trim() || 'Amazon',
      total: Number(total),
      tracking_number: tracking.trim() || undefined
    });
    setName(''); setTotal(''); setTracking('');
    load();
  };

  const advance = async (order) => {
    const next = nextStatus[order.status];
    if (!next) return;
    await base44.entities.Order.update(order.id, { status: next });
    load();
  };

  const remove = async (id) => {
    await base44.entities.Order.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <Truck size={16} className="text-sky" />
        <h3 className="font-heading font-extrabold text-base">Order History &amp; Tracking</h3>
      </div>

      <form onSubmit={addOrder} className="clay p-3 mb-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What did you order?"
            className="clay-inset flex-1 px-3 py-2 text-sm font-semibold outline-none min-w-0"
            required
          />
          <input
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="$ total"
            type="number"
            min="0"
            step="0.01"
            className="clay-inset w-24 px-3 py-2 text-sm font-semibold outline-none"
            required
          />
        </div>
        <div className="flex gap-2">
          <input
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="Store"
            className="clay-inset w-28 px-3 py-2 text-sm font-semibold outline-none"
          />
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Tracking # (optional)"
            className="clay-inset flex-1 px-3 py-2 text-sm font-semibold outline-none min-w-0"
          />
          <button type="submit" className="clay-btn pp-gradient text-white px-4 py-2 text-sm font-heading font-bold flex items-center gap-1 shrink-0">
            <Plus size={16} /> Log
          </button>
        </div>
      </form>

      {orders && orders.length === 0 && (
        <p className="text-center text-xs font-semibold text-muted-foreground py-3">
          No orders yet — log purchases here to track them from ordered to delivered.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {orders?.map((order) => {
          const stepIndex = STEPS.findIndex((s) => s.key === order.status);
          return (
            <div key={order.id} className="clay p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-heading font-bold truncate">{order.item_name}</div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {order.store} · ${order.total.toFixed(2)}
                    {order.tracking_number && <> · #{order.tracking_number}</>}
                  </div>
                </div>
                <button
                  onClick={() => remove(order.id)}
                  className="w-8 h-8 rounded-xl clay-inset flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Delete order"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Status stepper */}
              <div className="flex items-center gap-1 mt-3">
                {STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  return (
                    <div key={step.key} className="contents">
                      {i > 0 && (
                        <div className={`flex-1 h-1 rounded-full ${i <= stepIndex ? 'bg-mint' : 'bg-muted'}`} />
                      )}
                      <div className={`flex items-center gap-1 px-1.5 py-1 rounded-xl text-[10px] font-heading font-bold ${done ? 'bg-mint/20 text-accent-foreground' : 'text-muted-foreground'}`}>
                        {done ? <CircleCheck size={13} className="text-mint" /> : <step.icon size={13} />}
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {nextStatus[order.status] && (
                <button
                  onClick={() => advance(order)}
                  className="clay-btn mt-3 w-full bg-sky/15 text-sky py-2 text-xs font-heading font-bold flex items-center justify-center gap-1.5"
                >
                  <Truck size={14} /> Mark as {nextStatus[order.status] === 'shipped' ? 'shipped' : 'delivered'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}