import React from 'react';
import { useEggRoomStock } from '../hooks/useEggRoomStock';
import { StockFormSection } from '../Components/StockFormSection';
import { DateSelector } from '../Components/DateSelector';
import { SaveControls } from '../Components/SaveControls';
import PageHeader from '../Components/Layout/PageHeader';
import { useMediaQuery } from 'react-responsive';
import { EggRoomStockEntry } from '../types/eggRoomReport';

// Define a common type for the fields to ensure consistency
type StockFieldConfig = {
  key: keyof EggRoomStockEntry;
  label: string;
  disabled?: boolean;
  controlledBy?: keyof EggRoomStockEntry;
};

const sectionConfigs: Array<{
  id: string;
  title: string;
  icon: string;
  color: string;
  fields: StockFieldConfig[];
}> = [
  {
    id: 'table',
    title: 'Table Stock',
    icon: 'bi-box-seam',
    color: 'success',
    fields: [
      { key: 'table_opening', label: 'Opening', disabled: true },
      { key: 'table_received', label: 'Received' },
      { key: 'table_transfer', label: 'Transfer' },
      { key: 'table_damage', label: 'Damage' },
      { key: 'table_out', label: 'Out' },
    ],
  },
  {
    id: 'jumbo',
    title: 'Jumbo',
    icon: 'bi-egg-fried',
    color: 'primary',
    fields: [
      { key: 'jumbo_opening', label: 'Opening', disabled: true },
      { key: 'jumbo_received', label: 'Received' },
      { key: 'jumbo_transfer', label: 'Transfer' },
      { key: 'jumbo_waste', label: 'Waste' },
      { key: 'jumbo_in', label: 'In', disabled: true, controlledBy: 'table_out' },
    ],
  },
  {
    id: 'gradec',
    title: 'Grade C',
    icon: 'bi-award',
    color: 'warning',
    fields: [
      { key: 'grade_c_opening', label: 'Opening', disabled: true },
      { key: 'grade_c_shed_received', label: 'Shed Received' },
      { key: 'grade_c_room_received', label: 'Room Received', disabled: true, controlledBy: 'table_damage' },
      { key: 'grade_c_transfer', label: 'Transfer' },
      { key: 'grade_c_labour', label: 'Labour' },
      { key: 'grade_c_waste', label: 'Waste' },
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

  const handleFormChange = (field: keyof EggRoomStockEntry, value: number | string) => {
    handleChange(field, value);

    sectionConfigs.forEach(config => {
      config.fields.forEach(f => {
        if (f.controlledBy === field) {
          handleChange(f.key, value);
        }
      });
    });
  };

  return (
    <>
    <PageHeader title="Egg Room Stock" />
    <div className="container">
      {error && <div className="alert alert-danger text-center">{error}</div>}

      <form onSubmit={handleSave} className="card p-3 mb-4 mt-2">
        <DateSelector
          value={selectedDate}
          onChange={setSelectedDate}
          maxDate={new Date().toISOString().slice(0, 10)}
          disabled={loading}
          label='Report Date'
        />

        {sectionConfigs.map((config) => (
        <StockFormSection
          key={config.id}
          config={config}
          values={form}
          onChange={handleFormChange}
          calculateClosing={(values) => {
            const closingKey = closingFields[config.id];
            const value = calculateClosings(values)[closingKey];
            return typeof value === 'number' ? value : 0;
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
    </>
  );
};

export default EggRoomStock;