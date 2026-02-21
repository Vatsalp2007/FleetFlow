import React from 'react';

const FilterBar = ({ filters, onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label htmlFor="type" className="block text-xs font-medium text-gray-500 uppercase mb-1">Vehicle Type</label>
        <select
          id="type"
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors"
        >
          <option value="All">All</option>
          <option value="Truck">Truck</option>
          <option value="Van">Van</option>
          <option value="Bike">Bike</option>
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="status" className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
        <select
          id="status"
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors"
        >
          <option value="All">All</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="region" className="block text-xs font-medium text-gray-500 uppercase mb-1">Region</label>
        <select
          id="region"
          name="region"
          value={filters.region}
          onChange={handleChange}
          className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors"
        >
          <option value="All">All</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
