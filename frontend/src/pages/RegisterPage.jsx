import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }
    if (formData.password.length < 6) {
      return setError('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-box">
        <div className="auth-header">
          <div className="auth-brand-mark">
            <span className="gold-sparkle">✧</span>
            <h2>LumiStay</h2>
          </div>
          <p className="auth-subtitle">Tạo tài khoản thành viên LumiStay Club</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Họ và Tên</label>
            <div className="auth-input-wrap">
              <FiUser className="input-icon" />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Nguyễn Văn A" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="auth-input-wrap">
              <FiMail className="input-icon" />
              <input 
                type="email" 
                className="form-input" 
                placeholder="email@example.com" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Số Điện Thoại</label>
            <div className="auth-input-wrap">
              <FiPhone className="input-icon" />
              <input 
                type="tel" 
                className="form-input" 
                placeholder="0912 345 678" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                placeholder="Ít nhất 6 ký tự" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Xác Nhận Mật Khẩu</label>
            <div className="auth-input-wrap">
              <FiLock className="input-icon" />
              <input 
                type="password" 
                className="form-input" 
                placeholder="Nhập lại mật khẩu" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
            <FiCheck /> {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}
          </button>
        </form>

        <div className="auth-footer-link">
          <span>Đã có tài khoản?</span>
          <Link to="/login">Đăng nhập <FiArrowRight /></Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
