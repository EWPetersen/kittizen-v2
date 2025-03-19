import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavBarProps {
  onToggleAlerts: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ onToggleAlerts }) => {
  const { user, login, logout, anonymousLogin } = useAuth();
  const [showLoginForm, setShowLoginForm] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      setShowLoginForm(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  const handleGuestLogin = async () => {
    try {
      await anonymousLogin();
      setShowLoginForm(false);
    } catch (error) {
      console.error('Guest login failed:', error);
    }
  };
  
  return (
    <nav className="bg-space-black bg-opacity-80 border-b border-gray-800 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white">Star Citizen Stanton Map</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleAlerts}
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Alerts
          </button>
          
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">
                {user.isAnonymous ? 'Guest' : user.email}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <div>
              {showLoginForm ? (
                <div className="absolute right-0 top-16 bg-gray-900 p-4 rounded shadow-lg z-10">
                  <form onSubmit={handleLogin} className="flex flex-col space-y-2">
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="px-2 py-1 bg-gray-800 text-white rounded"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="px-2 py-1 bg-gray-800 text-white rounded"
                      required
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex-1"
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLoginForm(false)}
                        className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-700 text-white font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleGuestLogin}
                      className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-medium"
                    >
                      Continue as Guest
                    </button>
                  </form>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Login
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar; 