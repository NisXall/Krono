import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authcontext';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        setShowUserMenu(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-purple-700 shadow-lg relative">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
                    <Link to="/" className="text-white text-2xl font-bold flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/15 shadow-[0_0_24px_rgba(196,102,255,0.28)] backdrop-blur-sm">
                            <img src="/krono.svg" alt="Krono Logo" className="h-full w-full object-contain" />
                        </span>
                        <span className="tracking-wide">Krono</span>
                    </Link>
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                        <Link to="/" className="text-gray-200 hover:text-white transition cursor-pointer">Events</Link>
                        {user ? (
                            <>
                                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="text-gray-200 hover:text-white transition">Dashboard</Link>
                                <div ref={userMenuRef} className="relative z-50">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="text-white/90 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
                                        aria-label="User menu"
                                    >
                                        <FaUserCircle className="text-3xl" />
                                    </button>
                                    {showUserMenu && (
                                        <div className="absolute top-14 right-0 bg-white rounded-lg shadow-xl border border-gray-200 w-64 p-4">
                                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                                                    <p className="text-gray-500 text-xs">{user.email}</p>
                                                    {user.role === 'admin' && (
                                                        <p className="text-purple-600 text-xs font-semibold mt-1 uppercase">Admin</p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded transition font-medium text-sm"
                                            >
                                                <FaSignOutAlt /> Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-200 hover:text-white transition">Login</Link>
                                <Link to="/register" className="bg-white text-purple-900 hover:bg-gray-100 px-4 py-2 rounded-md font-semibold transition">Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
