"use client";

import { useAuth } from '@/lib/context/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
         // reload the page to ensure the user is authenticated
        router.refresh();
        // redirect to the home page after successful login
        router.push('/');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-900 px-4 relative">
      <div className="absolute inset-0">
        <Image
          src="/anh/bg.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="opacity-30"

          priority
        />
      </div>

      <div className="max-w-md w-full space-y-8 bg-black bg-opacity-50 p-8 rounded-lg backdrop-blur-sm relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Music Box Photobooth"
              width={150}
              height={50}
              className="glow-image"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Đăng nhập
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Vui lòng đăng nhập để sử dụng PhotoBooth
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-900 bg-opacity-60 p-4 my-4 border border-pink-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-pink-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-pink-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-200 mb-1">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-pink-500 placeholder-gray-300 text-white bg-purple-900 bg-opacity-70 focus:outline-none focus:ring-pink-400 focus:border-pink-400 focus:z-10 sm:text-sm"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-pink-500 placeholder-gray-300 text-white bg-purple-900 bg-opacity-70 focus:outline-none focus:ring-pink-400 focus:border-pink-400 focus:z-10 sm:text-sm"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-full text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
