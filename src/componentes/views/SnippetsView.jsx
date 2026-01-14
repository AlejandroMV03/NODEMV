/* src/componentes/views/SnippetsView.jsx */
import React from 'react';

export default function SnippetsView() {
    return (
        <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-blue-400 mb-6">~/snippets/favoritos</h2>
            <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800 font-mono text-sm">
                <div className="flex justify-between text-gray-500 mb-2 border-b border-gray-800 pb-2">
                    <span>fetch_data.js</span>
                    <span>Javascript</span>
                </div>
                <code className="text-gray-300">
                    <span className="text-purple-400">const</span> getData = <span className="text-purple-400">async</span> () ={'>'} {'{'}<br/>
                    &nbsp;&nbsp;<span className="text-purple-400">const</span> res = <span className="text-purple-400">await</span> fetch(<span className="text-green-400">'/api/v1'</span>);<br/>
                    &nbsp;&nbsp;<span className="text-purple-400">return</span> res.json();<br/>
                    {'}'}
                </code>
            </div>
        </div>
    );
}