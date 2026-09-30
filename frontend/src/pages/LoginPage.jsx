import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setEmail('admin@lumistay.com');
    setPassword('admin123456');
  };

  return (
    <div className="auth-page">
      <div className="auth-card-box">
        <div className="auth-header">
          <div className="auth-brand-mark">
            <span className="gold-sparkle">✧</span>
            <h2>LumiStay</h2>
          </div>
          <p className="auth-subtitle">Đăng nhập tài khoản LumiStay của bạn</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="auth-input-wrap">
              <FiMail className="input-icon" />
              <input 
                type="email" 
                className="form-input" 
                placeholder="email@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật Khẩu</label>
            <div className="auth-input-wrap">
              <FiLock className="input-icon" />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
            <FiLogIn /> {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="quick-demo-login">
          <span>Tài khoản Demo Admin:</span>
          <button type="button" className="btn-demo-quick" onClick={fillAdmin}>
            Điền tài khoản Admin (admin@lumistay.com)
          </button>
        </div>

        <div className="auth-footer-link">
          <span>Chưa có tài khoản?</span>
          <Link to="/register">Đăng ký ngay <FiArrowRight /></Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
