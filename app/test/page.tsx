"use client"

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Tailwind Test Page</h1>
      <p className="text-gray-700 mb-4">This is a test page to check if Tailwind CSS is working properly.</p>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-500 p-4 text-white rounded">Red Box</div>
        <div className="bg-green-500 p-4 text-white rounded">Green Box</div>
        <div className="bg-blue-500 p-4 text-white rounded">Blue Box</div>
      </div>
      
      <button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
        Test Button
      </button>
    </div>
  )
} 