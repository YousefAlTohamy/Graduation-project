import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="font-bold text-2xl">
            CareerCompass
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-white hover:bg-white hover:text-primary transition-colors duration-300 ease-in-out delay-75 px-2 py-1 rounded"
                >
                  Dashboard
                </Link>
                <Link
                  to="/jobs"
                  className="text-white hover:bg-white hover:text-primary transition-colors duration-300 ease-in-out delay-75 px-2 py-1 rounded"
                >
                  Jobs
                </Link>
                <Link
                  to="/market"
                  className="text-white hover:bg-white hover:text-primary transition-colors duration-300 ease-in-out delay-75 px-2 py-1 rounded"
                >
                  Market
                </Link>
                <Link to="/admin/scraping-sources" className="text-white hover:text-orange-200 transition text-sm">
                  ⚙ Sources
                </Link>
                <div className="flex items-center gap-4">
                  <Link
                    to="/profile"
                    className="text-white hover:bg-white hover:text-primary transition-colors duration-300 ease-in-out delay-75 px-2 py-1 rounded"
                  >
                    {user.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-orange-200 transition">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="Register-btn"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <span className="text-2xl">X</span> : <span className="text-2xl">=</span>}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-orange-400">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 hover:bg-white hover:text-primary transition-colors duration-300 ease-in-out delay-75 px-2 rounded"
                >
                  Dashboard
                </Link>
                <Link
                  to="/jobs"
                  className="block py-2 hover:bg-white hover:text-primary transition-colors duration-300 ease-in-out delay-75 px-2 rounded"
                >
                  Jobs
                </Link>
                <Link
                  to="/market"
                  className="block py-2 hover:bg-white hover:text-primary transition-colors duration-300 ease-in-out delay-75 px-2 rounded"
                >
                  Market
                </Link>
                <Link to="/admin/scraping-sources" className="block py-2 hover:text-orange-200">
                  ⚙ Sources
                </Link>
                <Link to="/admin/scraping-sources" className="block py-2 hover:text-orange-200">
                  ⚙ Scraping Sources
                </Link>
                <Link to="/profile" className="block py-2 hover:text-orange-200">
                  Profile
                </Link>
                <div className="pt-2 border-t border-orange-400">
                  <p className="py-2 text-sm">Welcome, {user.name}</p>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 text-red-300 hover:text-red-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 hover:bg-white hover:text-primary transition-colors duration-300 ease-in-out delay-75 px-2 rounded"
                >
                  Login
                </Link>
                <Link to="/register" className="Register-btn">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
