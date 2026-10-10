import React from 'react';

const SlotGrid = ({ slots, selectedSlotId, onSelectSlot }) => {
  if (!slots || slots.length === 0) {
    return <div className="text-gray-400 py-8 text-center">No slots available for this location.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {slots.map((slot) => {
        const isAvailable = slot.status === 'available';
        const isReserved = slot.status === 'reserved';
        const isOccupied = slot.status === 'occupied';
        const isSelected = selectedSlotId === slot._id;

        let baseClass = "p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer h-24 ";
        
        if (isSelected) {
          baseClass += "border-white bg-teal-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)] transform scale-105";
        } else if (isAvailable) {
          baseClass += "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500 text-emerald-400";
        } else if (isReserved) {
          baseClass += "border-amber-500/30 bg-amber-500/10 text-amber-500 cursor-not-allowed opacity-75";
        } else {
          baseClass += "border-red-500/30 bg-red-500/10 text-red-500 cursor-not-allowed opacity-75";
        }

        return (
          <div
            key={slot._id}
            className={baseClass}
            onClick={() => isAvailable && onSelectSlot(slot)}
          >
            <div className="text-lg font-bold mb-1">{slot.name}</div>
            <div className="text-xs uppercase tracking-wider font-semibold">
              {isSelected ? 'Selected' : slot.status}
            </div>
            {slot.type === 'ev' && <div className="text-xs mt-1">⚡ EV</div>}
            {slot.type === 'disabled' && <div className="text-xs mt-1">♿</div>}
          </div>
        );
      })}
    </div>
  );
};

export default SlotGrid;
