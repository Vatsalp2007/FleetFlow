import React from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FleetTable = ({ vehicles }) => {
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await deleteDoc(doc(db, "vehicles", id));
      } catch (err) {
        console.error("Error deleting vehicle:", err);
        alert("Failed to delete vehicle.");
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-vehicle/${id}`);
  };
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on trip':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in shop':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'out of service':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Vehicle</th>
              <th scope="col" className="px-6 py-4 font-semibold">License Plate</th>
              <th scope="col" className="px-6 py-4 font-semibold">Type</th>
              <th scope="col" className="px-6 py-4 font-semibold">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold">Region</th>
              <th scope="col" className="px-6 py-4 font-semibold">Current Load</th>
              <th scope="col" className="px-6 py-4 font-semibold">Capacity</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Odometer</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length > 0 ? (
              vehicles.map((vehicle, index) => (
                <tr 
                  key={vehicle.id} 
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === vehicles.length - 1 ? 'border-none' : ''}`}
                >
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex flex-col">
                    <span>{vehicle.name}</span>
                    <span className="text-xs text-gray-400 font-normal">{vehicle.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono border border-gray-200">
                      {vehicle.licensePlate}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{vehicle.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{vehicle.region}</td>
                  <td className="px-6 py-4 text-gray-600">{vehicle.currentLoad}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{vehicle.capacity}</td>
                  <td className="px-6 py-4 text-right text-gray-600 font-mono text-sm">{vehicle.odometer}</td>
                  <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(vehicle.id)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors" title="Edit">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onClick={() => handleDelete(vehicle.id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors" title="Delete">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-6 py-10 text-center text-gray-500 text-lg font-medium">
                  No Vehicles Added Yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FleetTable;
