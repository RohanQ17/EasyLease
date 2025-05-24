import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';


const generateMockData = () => {
  // Vehicle makes and models with corresponding price tiers
  const vehicleOptions = [
    { make: 'Toyota', models: ['Corolla', 'Camry', 'RAV4'], priceRange: [450, 650] },
    { make: 'Honda', models: ['Civic', 'Accord', 'CR-V'], priceRange: [470, 680] },
    { make: 'Tesla', models: ['Model 3', 'Model Y', 'Model S'], priceRange: [900, 1500] },
    { make: 'Ford', models: ['Focus', 'Fusion', 'Escape'], priceRange: [400, 600] },
    { make: 'BMW', models: ['3 Series', '5 Series', 'X3'], priceRange: [750, 1200] },
    { make: 'Mercedes', models: ['C-Class', 'E-Class', 'GLC'], priceRange: [800, 1300] },
    { make: 'Audi', models: ['A4', 'A6', 'Q5'], priceRange: [780, 1250] },
  ];
  
  const colors = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Gray', 'Green'];
  
  // Generate vehicles
  const vehicles = Array(20).fill().map((_, idx) => {
    const vehicleType = vehicleOptions[Math.floor(Math.random() * vehicleOptions.length)];
    const model = vehicleType.models[Math.floor(Math.random() * vehicleType.models.length)];
    const [min, max] = vehicleType.priceRange;
    const leaseAmount = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Set some vehicles as already leased to make the dashboard interesting
    const isLeased = idx < 12; // 12 out of 20 are leased initially
    
    return {
      id: `VEH-${1000 + idx}`,
      make: vehicleType.make,
      model: model,
      year: 2019 + Math.floor(Math.random() * 5), // 2019-2023
      color: colors[Math.floor(Math.random() * colors.length)],
      leaseAmount: leaseAmount,
      isLeased: isLeased,
      lessee: isLeased ? `LSE-${1000 + Math.floor(idx / 2)}` : null // Create lessees
    };
  });
  
  // Generate lessees - fewer lessees than leased vehicles (some have multiple)
  const lesseeNames = [
    "John Smith", "Emma Johnson", "Michael Brown", "Sophia Davis", "William Miller", 
    "Olivia Wilson", "James Jones", "Ava Taylor", "Robert Anderson", "Isabella Thomas"
  ];
  
  const lessees = Array(8).fill().map((_, idx) => {
    // Create lessees with varying registration dates (some recent, some older)
    const registrationDate = new Date();
    registrationDate.setMonth(registrationDate.getMonth() - Math.floor(Math.random() * 12)); // 0-12 months ago
    
    return {
      id: `LSE-${1000 + idx}`,
      name: lesseeNames[idx],
      email: `${lesseeNames[idx].toLowerCase().replace(' ', '.')}@example.com`,
      phone: `555-${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`,
      vehicleId: vehicles.filter(v => v.lessee === `LSE-${1000 + idx}`)[0]?.id || '',
      startDate: registrationDate.toISOString().substr(0, 10),
    };
  });
  
  // Generate payment history - create a realistic payment history over the last 12 months
  const payments = [];
  const currentDate = new Date();
  
  // For each lessee
  lessees.forEach(lessee => {
    // Skip if no vehicle is assigned
    if (!lessee.vehicleId) return;
    
    const vehicle = vehicles.find(v => v.id === lessee.vehicleId);
    if (!vehicle) return;
    
    // Registration date
    const startDate = new Date(lessee.startDate);
    
    // Generate monthly payments from start date until now
    for (let month = 0; month < 12; month++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(startDate.getMonth() + month);
      
      // Skip if payment date is in the future
      if (paymentDate > currentDate) continue;
      
      // Payment amount with some variations
      const baseAmount = vehicle.leaseAmount;
      const amount = Math.random() > 0.8 
        ? baseAmount * (Math.random() > 0.5 ? 0.8 : 1.2) // Sometimes over/under pay
        : baseAmount;
      
      // Sometimes miss payments
      if (Math.random() > 0.85) continue;
      
      // Occasionally delay payments
      const delayDays = Math.random() > 0.7 ? Math.floor(Math.random() * 15) : 0;
      paymentDate.setDate(paymentDate.getDate() + delayDays);
      
      payments.push({
        id: `PAY-${1000 + payments.length}`,
        lesseeId: lessee.id,
        amount: Math.round(amount),
        date: paymentDate.toISOString().substr(0, 10),
        status: 'completed',
      });
    }
    
    //  some lessees with overdue payments
    if (lessee.id === 'LSE-1002' || lessee.id === 'LSE-1005') {
      const lastPaymentDate = new Date();
      lastPaymentDate.setMonth(lastPaymentDate.getMonth() - 2);
      // Remove any recent payments
      const filteredPayments = payments.filter(p => 
        !(p.lesseeId === lessee.id && new Date(p.date) > lastPaymentDate)
      );
      payments.length = 0;
      payments.push(...filteredPayments);
    }
  });
  
  return { vehicles, lessees, payments };
};

const CarLeasingDashboard = () => {
  const [initialData] = useState(() => generateMockData());
  const [vehicles, setVehicles] = useState(initialData.vehicles);
  const [lessees, setLessees] = useState(initialData.lessees);
  const [payments, setPayments] = useState(initialData.payments);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleId: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    lesseeId: '',
    amount: 500,
    date: new Date().toISOString().substr(0, 10),
  });

  // Calculate dashboard metrics
  const leasedVehicles = vehicles.filter(v => v.isLeased);
  const availableVehicles = vehicles.filter(v => !v.isLeased);
  
  // Calculate expected payments based on lease duration and amounts
  const calculateExpectedPayments = () => {
    const expectedByMonth = {};
    
    lessees.forEach(lessee => {
      const vehicle = vehicles.find(v => v.id === lessee.vehicleId);
      if (!vehicle) return;
      
      const startDate = new Date(lessee.startDate);
      const currentDate = new Date();
      
      // For each month from lease start to current date
      for (let d = new Date(startDate); d <= currentDate; d.setMonth(d.getMonth() + 1)) {
        const monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (!expectedByMonth[monthKey]) expectedByMonth[monthKey] = 0;
        expectedByMonth[monthKey] += vehicle.leaseAmount;
      }
    });
    
    return expectedByMonth;
  };
  
  const expectedPaymentsByMonth = calculateExpectedPayments();
  
  // Organize actual payments by month
  const actualPaymentsByMonth = {};
  payments.forEach(payment => {
    const paymentDate = new Date(payment.date);
    const monthKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth() + 1}`;
    if (!actualPaymentsByMonth[monthKey]) actualPaymentsByMonth[monthKey] = 0;
    actualPaymentsByMonth[monthKey] += payment.amount;
  });
  
  // Total expected and collected
  const totalExpectedPayments = Object.values(expectedPaymentsByMonth).reduce((sum, val) => sum + val, 0);
  const totalCollectedPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // Find lessees with overdue payments (no payment in last 30 days)
  const lesseeWithOverduePayments = lessees.filter(lessee => {
    if (!lessee.vehicleId) return false;
    
    const lastPayment = payments
      .filter(p => p.lesseeId === lessee.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (!lastPayment) return true; // No payments made
    
    const lastPaymentDate = new Date(lastPayment.date);
    const currentDate = new Date();
    const daysSinceLastPayment = Math.floor((currentDate - lastPaymentDate) / (1000 * 60 * 60 * 24));
    
    return daysSinceLastPayment > 30; // Overdue if last payment was more than 30 days ago
  });

  // Prepare data for charts
  const prepareMonthlyPaymentData = () => {
    const last6Months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(currentDate.getMonth() - i);
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      const monthStr = month.toLocaleString('default', { month: 'short' });
      const yearStr = month.getFullYear().toString().substr(2, 2);
      
      last6Months.push({
        name: `${monthStr} ${yearStr}`,
        collected: actualPaymentsByMonth[monthKey] || 0,
        expected: expectedPaymentsByMonth[monthKey] || 0,
        month: monthKey
      });
    }
    
    return last6Months;
  };
  
  const monthlyPaymentData = prepareMonthlyPaymentData();
  
  // Prepare vehicle utilization trend data (simulate changes over time)
  const prepareVehicleUtilizationData = () => {
    const utilizationData = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const month = new Date();
      month.setMonth(currentDate.getMonth() - 11 + i);
      const monthStr = month.toLocaleString('default', { month: 'short' });
      const yearStr = month.getFullYear().toString().substr(2, 2);
      
      // Simulate gradually increasing utilization with some fluctuations
      const baseUtilization = 40 + i * 5; // Starts at 40%, increases by 5% per month
      const fluctuation = Math.random() * 10 - 5; // -5 to +5
      const utilization = Math.min(100, Math.max(0, baseUtilization + fluctuation));
      
      utilizationData.push({
        name: `${monthStr} ${yearStr}`,
        utilization: Math.round(utilization)
      });
    }
    
    return utilizationData;
  };
  
  const vehicleUtilizationData = prepareVehicleUtilizationData();
  
  // Payment status distribution
  const paymentStatusData = [
    { name: 'Paid On Time', value: payments.length - 15 },
    { name: 'Paid Late', value: 10 },
    { name: 'Missed', value: 5 }
  ];
  
  // Vehicle category distribution
  const vehicleCategoryData = [
    { name: 'Economy', value: vehicles.filter(v => v.leaseAmount < 600).length },
    { name: 'Mid-range', value: vehicles.filter(v => v.leaseAmount >= 600 && v.leaseAmount < 900).length },
    { name: 'Premium', value: vehicles.filter(v => v.leaseAmount >= 900).length }
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4BC0C0'];

  // Handle form submissions
  const handleRegistration = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!registrationForm.name || !registrationForm.email || !registrationForm.phone || !registrationForm.vehicleId) {
      alert('Please fill in all fields');
      return;
    }
    
    // Check if vehicle is available
    const vehicle = vehicles.find(v => v.id === registrationForm.vehicleId);
    if (!vehicle) {
      alert('Invalid vehicle ID');
      return;
    }
    if (vehicle.isLeased) {
      alert('Vehicle is already leased');
      return;
    }
    
    // Create new lessee
    const newLessee = {
      id: `LSE-${lessees.length + 1000}`,
      name: registrationForm.name,
      email: registrationForm.email,
      phone: registrationForm.phone,
      vehicleId: registrationForm.vehicleId,
      startDate: new Date().toISOString().substr(0, 10),
    };
    
    // Update vehicle status
    const updatedVehicles = vehicles.map(v => 
      v.id === registrationForm.vehicleId 
        ? { ...v, isLeased: true, lessee: newLessee.id } 
        : v
    );
    
    setLessees([...lessees, newLessee]);
    setVehicles(updatedVehicles);
    setRegistrationForm({
      name: '',
      email: '',
      phone: '',
      vehicleId: '',
    });
    
    alert(`Registration successful! Lessee ID: ${newLessee.id}`);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!paymentForm.lesseeId || !paymentForm.amount || !paymentForm.date) {
      alert('Please fill in all fields');
      return;
    }
    
    // Check if lessee exists
    const lessee = lessees.find(l => l.id === paymentForm.lesseeId);
    if (!lessee) {
      alert('Invalid lessee ID');
      return;
    }
    
    // Create new payment
    const newPayment = {
      id: `PAY-${payments.length + 1000}`,
      lesseeId: paymentForm.lesseeId,
      amount: Number(paymentForm.amount),
      date: paymentForm.date,
      status: 'completed',
    };
    
    setPayments([...payments, newPayment]);
    setPaymentForm({
      lesseeId: '',
      amount: 500,
      date: new Date().toISOString().substr(0, 10),
    });
    
    alert(`Payment recorded successfully! Payment ID: ${newPayment.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">EasyLease</h1>
          <nav className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-700' : 'text-white hover:bg-white/10'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'register' ? 'bg-white text-indigo-700' : 'text-white hover:bg-white/10'}`}
            >
              Register Lessee
            </button>
            <button 
              onClick={() => setActiveTab('payment')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'payment' ? 'bg-white text-indigo-700' : 'text-white hover:bg-white/10'}`}
            >
              Process Payment
            </button>
            <button 
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'vehicles' ? 'bg-white text-indigo-700' : 'text-white hover:bg-white/10'}`}
            >
              Vehicle Fleet
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-blue-500/30">
                <h3 className="text-xl font-semibold text-blue-300 mb-2">Vehicle Status</h3>
                <div className="flex justify-between items-center">
                  <div>
                  <p className="text-4xl font-bold">{leasedVehicles.length}</p>
                    <p className="text-gray-400">Leased</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">{availableVehicles.length}</p>
                    <p className="text-gray-400">Available</p>
                  </div>
                </div>

                <div className="mt-4 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" 
                    style={{ width: `${(leasedVehicles.length / vehicles.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-emerald-500/30">
                <h3 className="text-xl font-semibold text-emerald-300 mb-2">Payments</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-4xl font-bold">${totalCollectedPayments.toLocaleString()}</p>
                    <p className="text-gray-400">Collected</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">${totalExpectedPayments.toLocaleString()}</p>
                    <p className="text-gray-400">Expected</p>
                  </div>
                </div>

                <div className="mt-4 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400" 
                    style={{ width: `${totalExpectedPayments > 0 ? (totalCollectedPayments / totalExpectedPayments) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-600/20 to-rose-800/20 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-rose-500/30">
                <h3 className="text-xl font-semibold text-rose-300 mb-2">Overdue Payments</h3>
                <p className="text-4xl font-bold">{lesseeWithOverduePayments.length}</p>
                <p className="text-gray-400">Lessees with pending/overdue payments</p>
                
                <div className="mt-4 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-red-400" 
                    style={{ width: `${lessees.length > 0 ? (lesseeWithOverduePayments.length / lessees.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-indigo-600/10 to-indigo-800/10 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-indigo-500/30">
                <h3 className="text-xl font-semibold mb-4">Vehicle Category Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vehicleCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {vehicleCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Vehicles']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-purple-500/30">
                <h3 className="text-xl font-semibold mb-4">Monthly Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={monthlyPaymentData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" tick={{ fill: '#aaa' }} />
                    <YAxis tick={{ fill: '#aaa' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#222', borderColor: '#555' }} 
                      labelStyle={{ color: '#ddd' }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                    />
                    <Legend />
                    <Bar dataKey="collected" name="Collected" fill="#8884d8" />
                    <Bar dataKey="expected" name="Expected" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-blue-500/30">
                <h3 className="text-xl font-semibold mb-4">Fleet Utilization Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={vehicleUtilizationData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" tick={{ fill: '#aaa' }} />
                    <YAxis tick={{ fill: '#aaa' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#222', borderColor: '#555' }} 
                      labelStyle={{ color: '#ddd' }}
                      formatter={(value) => [`${value}%`, 'Utilization']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="utilization" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorUtilization)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gradient-to-br from-amber-600/10 to-amber-800/10 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-amber-500/30">
                <h3 className="text-xl font-semibold mb-4">Payment Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Payments']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overdue Payments Table */}
            <div className="bg-gradient-to-br from-gray-700/30 to-gray-800/30 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-500/30">
              <h3 className="text-xl font-semibold mb-4">Overdue Payments</h3>
              {lesseeWithOverduePayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-800/50 rounded-lg overflow-hidden">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lessee ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vehicle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Days Overdue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {lesseeWithOverduePayments.map(lessee => {
                        const vehicle = vehicles.find(v => v.id === lessee.vehicleId);
                        const lastPayment = payments
                          .filter(p => p.lesseeId === lessee.id)
                          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                        
                        const daysSinceLastPayment = lastPayment 
                          ? Math.floor((new Date() - new Date(lastPayment.date)) / (1000 * 60 * 60 * 24)) 
                          : Math.floor((new Date() - new Date(lessee.startDate)) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <tr key={lessee.id} className="hover:bg-gray-700/30">
                            <td className="px-6 py-4 whitespace-nowrap">{lessee.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{lessee.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{lessee.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{lessee.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.id})` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {!lastPayment ? 'No payments' : 'Payment overdue'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {daysSinceLastPayment} days
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400">No overdue payments. All lessees are up to date!</p>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'register' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-600/10 to-indigo-800/10 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-indigo-500/30"
          >
            <h2 className="text-2xl font-bold mb-6">Register New Lessee</h2>
            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={registrationForm.name} 
                  onChange={e => setRegistrationForm({...registrationForm, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={registrationForm.email} 
                  onChange={e => setRegistrationForm({...registrationForm, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white"
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={registrationForm.phone} 
                  onChange={e => setRegistrationForm({...registrationForm, phone: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white"
                  placeholder="Enter phone number"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle</label>
                <select 
                  value={registrationForm.vehicleId} 
                  onChange={e => setRegistrationForm({...registrationForm, vehicleId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white"
                  required
                >
                  <option value="">Select a vehicle</option>
                  {availableVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.year}) - ${vehicle.leaseAmount}/month - {vehicle.id}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                Register Lessee
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'payment' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto bg-gradient-to-br from-emerald-600/10 to-emerald-800/10 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-emerald-500/30"
          >
            <h2 className="text-2xl font-bold mb-6">Process Lease Payment</h2>
            <form onSubmit={handlePayment} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Lessee</label>
                <select 
                  value={paymentForm.lesseeId} 
                  onChange={e => {
                    const lessee = lessees.find(l => l.id === e.target.value);
                    const vehicle = lessee ? vehicles.find(v => v.id === lessee.vehicleId) : null;
                    setPaymentForm({
                      ...paymentForm, 
                      lesseeId: e.target.value,
                      amount: vehicle ? vehicle.leaseAmount : 500
                    });
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white"
                  required
                >
                  <option value="">Select a lessee</option>
                  {lessees.map(lessee => {
                    const vehicle = vehicles.find(v => v.id === lessee.vehicleId);
                    return (
                      <option key={lessee.id} value={lessee.id}>
                        {lessee.name} - {vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'} ({lessee.id})
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Amount ($)</label>
                <input 
                  type="number" 
                  value={paymentForm.amount} 
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Date</label>
                <input 
                  type="date" 
                  value={paymentForm.date} 
                  onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                Process Payment
              </button>
            </form>

            {/* Payment History */}
            {lessees.length > 0 && payments.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-semibold mb-4">Recent Payments</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-800/50 rounded-lg overflow-hidden">
                    <thead className="bg-gray-700/50">
                      <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Payment ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lessee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {payments.slice().reverse().slice(0, 5).map(payment => {
                        const lessee = lessees.find(l => l.id === payment.lesseeId);
                        
                        return (
                          <tr key={payment.id} className="hover:bg-gray-700/30">
                            <td className="px-4 py-3 whitespace-nowrap">{payment.id}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{lessee ? lessee.name : 'Unknown'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">${payment.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{new Date(payment.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'vehicles' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-gray-700/30 to-gray-800/30 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-500/30"
          >
            <h2 className="text-2xl font-bold mb-6">Vehicle Fleet Management</h2>
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="mr-2 px-3 py-1 rounded-full bg-blue-900/40 text-blue-300 text-sm font-medium">
                  Total: {vehicles.length}
                </span>
                <span className="mr-2 px-3 py-1 rounded-full bg-green-900/40 text-green-300 text-sm font-medium">
                  Available: {availableVehicles.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-900/40 text-purple-300 text-sm font-medium">
                  Leased: {leasedVehicles.length}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <select className="px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/30 text-white text-sm">
                  <option value="">Filter by Make</option>
                  {Array.from(new Set(vehicles.map(v => v.make))).map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
                <select className="px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/30 text-white text-sm">
                  <option value="">Filter by Status</option>
                  <option value="leased">Leased</option>
                  <option value="available">Available</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800/50 rounded-lg overflow-hidden">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Make & Model</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lessee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lease Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {vehicles.map(vehicle => {
                    const lessee = lessees.find(l => l.id === vehicle.lessee);
                    
                    return (
                      <tr key={vehicle.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 whitespace-nowrap">{vehicle.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{vehicle.make} {vehicle.model}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{vehicle.year}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{vehicle.color}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.isLeased ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                            {vehicle.isLeased ? 'Leased' : 'Available'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{lessee ? lessee.name : '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">${vehicle.leaseAmount}/month</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button className="text-indigo-400 hover:text-indigo-300 mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button className="text-rose-400 hover:text-rose-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vehicle Categories Summary */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-amber-600/10 to-amber-800/10 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-amber-500/30">
                <h3 className="text-lg font-semibold text-amber-300 mb-2">Economy Vehicles</h3>
                <p className="text-3xl font-bold">{vehicles.filter(v => v.leaseAmount < 600).length}</p>
                <p className="text-gray-400 text-sm">Average Lease: ${Math.round(
                  vehicles.filter(v => v.leaseAmount < 600).reduce((sum, v) => sum + v.leaseAmount, 0) / 
                  Math.max(1, vehicles.filter(v => v.leaseAmount < 600).length)
                )}/month</p>
                <p className="text-gray-400 text-sm">Utilization: {Math.round(
                  (vehicles.filter(v => v.leaseAmount < 600 && v.isLeased).length / 
                  Math.max(1, vehicles.filter(v => v.leaseAmount < 600).length)) * 100
                )}%</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-blue-500/30">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Mid-range Vehicles</h3>
                <p className="text-3xl font-bold">{vehicles.filter(v => v.leaseAmount >= 600 && v.leaseAmount < 900).length}</p>
                <p className="text-gray-400 text-sm">Average Lease: ${Math.round(
                  vehicles.filter(v => v.leaseAmount >= 600 && v.leaseAmount < 900).reduce((sum, v) => sum + v.leaseAmount, 0) / 
                  Math.max(1, vehicles.filter(v => v.leaseAmount >= 600 && v.leaseAmount < 900).length)
                )}/month</p>
                <p className="text-gray-400 text-sm">Utilization: {Math.round(
                  (vehicles.filter(v => v.leaseAmount >= 600 && v.leaseAmount < 900 && v.isLeased).length / 
                  Math.max(1, vehicles.filter(v => v.leaseAmount >= 600 && v.leaseAmount < 900).length)) * 100
                )}%</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-purple-500/30">
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Premium Vehicles</h3>
                <p className="text-3xl font-bold">{vehicles.filter(v => v.leaseAmount >= 900).length}</p>
                <p className="text-gray-400 text-sm">Average Lease: ${Math.round(
                  vehicles.filter(v => v.leaseAmount >= 900).reduce((sum, v) => sum + v.leaseAmount, 0) / 
                  Math.max(1, vehicles.filter(v => v.leaseAmount >= 900).length)
                )}/month</p>
                <p className="text-gray-400 text-sm">Utilization: {Math.round(
                  (vehicles.filter(v => v.leaseAmount >= 900 && v.isLeased).length / 
                  Math.max(1, vehicles.filter(v => v.leaseAmount >= 900).length)) * 100
                )}%</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 p-6 mt-10">
        <div className="container mx-auto text-center text-gray-400">
          <p>© 2023 VehicleLease Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CarLeasingDashboard; 
                    