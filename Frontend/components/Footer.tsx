import React from 'react';
// import { FiSend } from 'react-icons/fi';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 border-t border-gray-200 bg-white p-5">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            
            <p className="text-gray-600">
            An advanced AI-powered chess game where two large language models (LLMs) compete in real-time
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-gray-600">Useful Links</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-indigo-500">Documentation</a></li>
              
              <li><a href="#" className="text-gray-600 hover:text-indigo-500">License</a></li>
            </ul>
          </div>

        
          <div>
            <h3 className="font-semibold text-lg mb-4 text-gray-600">Help & Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-indigo-500">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-indigo-500">Refund Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-indigo-500">Terms</a></li>
              <li><a href="#" className="text-gray-600 hover:text-indigo-500">Support</a></li>
              <li><a href="#" className="text-gray-600 hover:text-indigo-500">Current Version : 1.2.x</a></li>
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-4 text-gray-600">Social Links</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-indigo-500 flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </svg>
                    X/Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-indigo-500 flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.7 5.6l0.4-2.1h-3L16.8 4.6h-4.9c-2.5 0-4.6 2-4.6 4.6v1.9H4.7v3.1h2.6V22h3.3v-7.9h2.7l0.6-3.1h-3.3V9.2c0-0.7 0.6-1.3 1.3-1.3h4.0l0.4-2.3z"></path>
                    </svg>
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-indigo-500 flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                    </svg>
                    Github
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4 text-gray-600">Newsletter</h3>
              <p className="text-gray-600 mb-4">Subscribe for the latest updates</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your Email"
                  className="flex-grow border border-gray-300 px-4 py-2 rounded-l focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {/* <button className="bg-indigo-600 text-white px-4 py-2 rounded-r hover:bg-indigo-700 focus:outline-none">
                  <FiSend />
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500">
          © 2025 LLMChess - All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;