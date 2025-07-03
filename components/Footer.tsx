import SmartLink from './SmartLink'

const organizations = [
  { name: "OpenSats", link: "https://opensats.org" },
  { name: "Btrust", link: "https://btrust.tech" },
  { name: "Brink", link: "https://brink.dev" },
  { name: "Maelstrom", link: "https://maelstrom.fund/bitcoin-grant-program/" },
  { name: "Spiral", link: "https://spiral.xyz" },
]

const resources = [
  { name: "FAQ", link: "/#faq" },
]

const socialLinks = [
  { 
    name: "Twitter", 
    link: "https://x.com/Bitcoin_Devs", 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    )
  },
  { 
    name: "GitHub", 
    link: "https://github.com/bitcoin-dev-project/", 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    )
  },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect width="32" height="32" rx="16" fill="#0D0E12" />
                  <path d="M20.5714 14.2857C21.3536 13.2768 21.2746 11.7143 19.8214 11C18.375 10.2857 16.5714 11 16.0714 11.5714L14.2143 13.4286" stroke="#F2A900" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12.1429 14.8571C11 15.8571 10.3536 18.0089 11.8929 19.2857C13.4286 20.5536 15.4286 19.8571 16 19.2857L17.8571 17.4286" stroke="#F2A900" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 7L16 25" stroke="#F2A900" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="16" cy="7" r="1" fill="#F2A900"/>
                  <circle cx="16" cy="25" r="1" fill="#F2A900"/>
                </svg>
              </div>
              <span className="font-bold text-lg sm:text-xl text-white">Bitcoin Grants</span>
            </div>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base max-w-md">
              Streamlining the funding process for Bitcoin development. Apply once, reach multiple organizations, and accelerate your Bitcoin project.
            </p>

            <div className="flex space-x-4 sm:space-x-5">
              {socialLinks.map((item, index) => (
                <a 
                  key={index} 
                  href={item.link} 
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg">Organizations</h3>
            <ul className="space-y-2 sm:space-y-3">
              {organizations.map((org, index) => (
                <li key={index}>
                  <a 
                    href={org.link} 
                    className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {org.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg">Resources</h3>
            <ul className="space-y-2 sm:space-y-3">
              {resources.map((resource, index) => (
                <li key={index}>
                  <SmartLink 
                    href={resource.link} 
                    className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
                  >
                    {resource.name}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © {new Date().getFullYear()} Bitcoin Grants Common Application. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
} 