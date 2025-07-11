import { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [form, setForm] = useState({ type: 'income', amount: '', category: '', description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [transRes, sumRes] = await Promise.all([
      axios.get('/transactions'),
      axios.get('/summary')
    ]);
    setTransactions(transRes.data);
    setSummary(sumRes.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/transactions', form);
    setForm({ type: 'income', amount: '', category: '', description: '' });
    fetchData();
  };

  // Responsive grid for summary cards
  const isMobile = window.innerWidth < 768;

  const containerStyle = {
    padding: '16px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1000px',
    margin: '0 auto'
  };

  const cardContainerStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '16px'
  };

  const cardStyle = (bgColor) => ({
    backgroundColor: bgColor,
    padding: '16px',
    borderRadius: '8px'
  });

  const headingStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px'
  };

  const subheadingStyle = {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px'
  };

  const formStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px'
  };

  const inputStyle = {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minWidth: '120px',
    flex: '1'
  };

  const buttonStyle = {
    backgroundColor: '#3B82F6',
    color: 'white',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const thTdStyle = {
    padding: '8px',
    border: '1px solid #ccc',
    textAlign: 'left'
  };

  const headerRowStyle = {
    backgroundColor: '#f0f0f0'
  };

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Cookie Financial Dashboard</h1>
      <p style={{ marginBottom: '16px' }}>Welcome, {user.name}!</p>

      <div style={cardContainerStyle}>
        <div style={cardStyle('#d1fae5')}>
          <h2 style={subheadingStyle}>Total Income</h2>
          <p>₹{summary.totalIncome}</p>
        </div>
        <div style={cardStyle('#fecaca')}>
          <h2 style={subheadingStyle}>Total Expenses</h2>
          <p>₹{summary.totalExpense}</p>
        </div>
        <div style={cardStyle('#bfdbfe')}>
          <h2 style={subheadingStyle}>Balance</h2>
          <p>₹{summary.balance}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={formStyle}>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
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
        <input
          type="text"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="Category"
          style={inputStyle}
          required
        />
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>Add Transaction</button>
      </form>

      <h2 style={{ ...subheadingStyle, marginBottom: '8px' }}>Transaction History</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={headerRowStyle}>
            <th style={thTdStyle}>Date</th>
            <th style={thTdStyle}>Type</th>
            <th style={thTdStyle}>Amount</th>
            <th style={thTdStyle}>Category</th>
            <th style={thTdStyle}>Description</th>
            <th style={thTdStyle}>Created By</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t._id}>
              <td style={thTdStyle}>{new Date(t.date).toLocaleDateString()}</td>
              <td style={thTdStyle}>{t.type}</td>
              <td style={thTdStyle}>₹{t.amount}</td>
              <td style={thTdStyle}>{t.category}</td>
              <td style={thTdStyle}>{t.description || '-'}</td>
              <td style={thTdStyle}>{t.createdBy.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
