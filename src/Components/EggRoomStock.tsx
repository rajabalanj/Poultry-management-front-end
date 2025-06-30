import React from 'react';
import { useEggRoomStock } from '../hooks/useEggRoomStock';
import { StockFormSection } from '../Components/StockFormSection';
import { DateSelector } from '../Components/DateSelector';
import { SaveControls } from '../Components/SaveControls';
import PageHeader from '../Components/Layout/PageHeader';
import { useMediaQuery } from 'react-responsive';
import { EggRoomStockEntry } from '../types/eggRoomReport';

const sectionConfigs = [
  {
    id: 'table',
    title: 'Table Stock',
    icon: 'bi-box-seam',
    color: 'success',
    fields: [
      { key: 'table_opening' as const, label: 'Opening' },
      { key: 'table_received' as const, label: 'Received' },
      { key: 'table_transfer' as const, label: 'Transfer' },
      { key: 'table_damage' as const, label: 'Damage' },
      { key: 'table_out' as const, label: 'Out' },
    ],
  },
  {
    id: 'jumbo',
    title: 'Jumbo',
    icon: 'bi-egg-fried',
    color: 'primary',
    fields: [
      { key: 'jumbo_opening' as const, label: 'Opening' },
      { key: 'jumbo_received' as const, label: 'Received' },
      { key: 'jumbo_transfer' as const, label: 'Transfer' },
      { key: 'jumbo_waste' as const, label: 'Waste' },
      { key: 'jumbo_in' as const, label: 'In' },
    ],
  },
  {
    id: 'gradec',
    title: 'Grade C',
    icon: 'bi-award',
    color: 'warning',
    fields: [
      { key: 'grade_c_opening' as const, label: 'Opening' },
      { key: 'grade_c_shed_received' as const, label: 'Shed Received' },
      { key: 'grade_c_room_received' as const, label: 'Room Received' },
      { key: 'grade_c_transfer' as const, label: 'Transfer' },
      { key: 'grade_c_labour' as const, label: 'Labour' },
      { key: 'grade_c_waste' as const, label: 'Waste' },
    ],
  },
];

const closingFields: Record<string, keyof EggRoomStockEntry> = {
  table: 'table_closing',
  jumbo: 'jumbo_closing',
  gradec: 'grade_c_closing'
};

const EggRoomStock: React.FC = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const {
    form,
    loading,
    editing,
    error,
    selectedDate,
    calculateClosings,
    handleChange,
    handleSave,
    handleDelete,
    setSelectedDate,
  } = useEggRoomStock();

  return (
    <div className="container">
      <PageHeader title="Egg Room Stock" />
      {error && <div className="alert alert-danger text-center">{error}</div>}
      
      <form onSubmit={handleSave} className="card p-3 mb-4">
        <DateSelector
          value={selectedDate}
          onChange={setSelectedDate}
          maxDate={new Date().toISOString().slice(0, 10)}
          disabled={loading}
        />

        {sectionConfigs.map((config) => (
        <StockFormSection
          key={config.id}
          config={config}
          values={form}
          onChange={handleChange}
          calculateClosing={(values) => {
            const closingKey = closingFields[config.id];
            const value = calculateClosings(values)[closingKey];
            return typeof value === 'number' ? value : 0; // Fallback to 0 if not number
        }}
          isMobile={isMobile}
        />
      ))}

        <SaveControls
          editing={editing}
          loading={loading}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </form>
    </div>
  );
};

export default EggRoomStock;