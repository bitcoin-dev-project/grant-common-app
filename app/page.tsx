"use client"
import GrantApplicationForm from '../components/GrantApplicationForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 tracking-tight">
              Bitcoin Grant Application Portal
            </h1>
            <p className="text-lg text-gray-700 mb-8 max-w-3xl mx-auto">
              A unified platform for applying to Bitcoin-related grants across multiple organizations
            </p>
            <div className="bg-amber-50 p-5 border-l-4 border-amber-500 rounded-md mb-8 text-left shadow-sm">
              <h2 className="text-xl font-semibold text-amber-800 mb-2">Important Information</h2>
              <p className="text-amber-700">
                This application will be submitted to the organization you select. Each organization has its own evaluation criteria and process.
                Please ensure your application aligns with the goals and requirements of the selected organization.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-gray-800 text-white py-6 px-8">
              <h2 className="text-2xl font-bold">Grant Application Form</h2>
              <p className="text-gray-300 text-sm mt-1">
                Complete the form below to apply for funding
              </p>
            </div>
            <div className="p-6 md:p-10">
              <GrantApplicationForm />
            </div>
          </div>
          
          <footer className="mt-12 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Bitcoin Grant Application Portal</p>
          </footer>
        </div>
      </div>
    </main>
  )
} 