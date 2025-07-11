import { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ type: 'income', amount: '', category: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, sumRes, catRes] = await Promise.all([
        axios.get('/transactions'),
        axios.get('/summary'),
        axios.get('/categories')
      ]);
      setTransactions(transRes.data);
      setSummary(sumRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !form.category) {
        setForm({ ...form, category: catRes.data[0]._id });
      }
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/transactions', form);
      setForm({ type: 'income', amount: '', category: categories[0]?._id || '', description: '' });
      setError('');
      fetchData();
    } catch (err) {
      setError(err.response?.data.error || 'Failed to add transaction');
    }
  };

  // Responsive styles
  const isMobile = window.innerWidth < 768; // Simple media query-like check
  const containerStyle = {
    padding: '1rem',
    maxWidth: isMobile ? '100%' : '80rem',
    margin: '0 auto'
  };
  const gridStyle = {
    display: isMobile ? 'flex' : 'grid',
    flexDirection: isMobile ? 'column' : 'unset',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem'
  };
  const inputStyle = {
    padding: '0.5rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.375rem',
    outline: 'none',
    width: isMobile ? '100%' : 'auto',
    minWidth: isMobile ? 'auto' : '150px',
    transition: 'all 0.2s'
  };
  const buttonStyle = {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    width: isMobile ? '100%' : 'auto'
  };

  return (
    <div style={containerStyle}>
      <h1 style={{
        fontSize: isMobile ? '1.5rem' : '1.875rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: '#1F2937'
      }}>Cookie Financial Dashboard</h1>
      <p style={{
        marginBottom: '1rem',
        color: '#4B5563',
        fontSize: isMobile ? '0.9rem' : '1rem'
      }}>Welcome, {user.name}!</p>
      {error && (
        <p style={{
          color: '#EF4444',
          marginBottom: '1rem',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}>{error}</p>
      )}
      
      <div style={gridStyle}>
        <div style={{
          backgroundColor: '#DCFCE7',
          padding: '1rem',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            color: '#065F46'
          }}>Total Income</h2>
          <p style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            color: '#16A34A'
          }}>₹{summary.totalIncome}</p>
        </div>
        <div style={{
          backgroundColor: '#FEE2E2',
          padding: '1rem',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            color: '#991B1B'
          }}>Total Expenses</h2>
          <p style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            color: '#DC2626'
          }}>₹{summary.totalExpense}</p>
        </div>
        <div style={{
          backgroundColor: '#DBEAFE',
          padding: '1rem',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            color: '#1E40AF'
          }}>Balance</h2>
          <p style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            color: '#3B82F6'
          }}>₹{summary.balance}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value, category: '' })}
          style={inputStyle}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Amount"
          style={inputStyle}
          required
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          style={inputStyle}
          required
        >
          <option value="">Select Category</option>
          {categories
            .filter(cat => cat.type === form.type)
            .map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
        </select>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          style={inputStyle}
        />
        <button
          type="submit"
          style={buttonStyle}
        >
          Add Transaction
        </button>
      </form>

      <h2 style={{
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        color: '#1F2937'
      }}>Transaction History</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.5rem'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#E5E7EB' }}>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', textAlign: 'left', color: '#4B5563', fontSize: isMobile ? '0.8rem' : '1rem' }}>Date</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', textAlign: 'left', color: '#4B5563', fontSize: isMobile ? '0.8rem' : '1rem' }}>Type</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', textAlign: 'left', color: '#4B5563', fontSize: isMobile ? '0.8rem' : '1rem' }}>Amount</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', textAlign: 'left', color: '#4B5563', fontSize: isMobile ? '0.8rem' : '1rem' }}>Category</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', textAlign: 'left', color: '#4B5563', fontSize: isMobile ? '0.8rem' : '1rem' }}>Description</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', textAlign: 'left', color: '#4B5563', fontSize: isMobile ? '0.8rem' : '1rem' }}>Created By</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t._id} style={{ ':hover': { backgroundColor: '#F9FAFB' } }}>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', fontSize: isMobile ? '0.8rem' : '1rem' }}>{new Date(t.date).toLocaleDateString()}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', textTransform: 'capitalize', fontSize: isMobile ? '0.8rem' : '1rem' }}>{t.type}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', fontSize: isMobile ? '0.8rem' : '1rem' }}>₹{t.amount}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', fontSize: isMobile ? '0.8rem' : '1rem' }}>{t.category.name}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', fontSize: isMobile ? '0.8rem' : '1rem' }}>{t.description || '-'}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB', fontSize: isMobile ? '0.8rem' : '1rem' }}>{t.createdBy.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;