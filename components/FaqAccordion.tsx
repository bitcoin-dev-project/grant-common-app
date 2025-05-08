'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type FaqItemProps = {
  question: string
  answer: React.ReactNode
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        className="flex w-full items-center justify-between py-6 text-left text-lg font-medium text-gray-900 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <span className="ml-6 flex-shrink-0">
          <svg
            className={`h-6 w-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="pb-6 pr-12">
              <div className="text-base text-gray-600 space-y-2">
                {answer}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqAccordion() {
  const faqs = [
    {
      question: "What is the Bitcoin Grants Common Application?",
      answer: (
        <>
          <p>
            The Bitcoin Grants Common Application is a unified platform that allows developers, researchers, and creators to apply for funding from multiple Bitcoin-focused organizations with a single application.
          </p>
          <p>
            Instead of filling out separate applications for each organization, you complete one comprehensive form and select which organizations you&apos;d like to apply to.
          </p>
        </>
      )
    },
    {
      question: "Which organizations participate in the common application?",
      answer: (
        <p>
          Currently, the common application serves five major Bitcoin funding organizations: OpenSats, Btrust, Brink, Maelstrom, and Spiral. Each organization has its own focus areas and evaluation criteria.
        </p>
      )
    },
    {
      question: "How does the application process work?",
      answer: (
        <ol className="list-decimal list-inside space-y-2">
          <li>Fill out the common application form with details about your project</li>
          <li>Select which organizations you&apos;d like to apply to</li>
          <li>Submit your application</li>
          <li>Each selected organization reviews your application independently</li>
          <li>Organizations will contact you directly if they&apos;re interested in funding your project</li>
        </ol>
      )
    },
    {
      question: "What types of projects get funded?",
      answer: (
        <p>
          Each organization has its own focus areas, but generally they fund projects that contribute to the Bitcoin ecosystem. This includes protocol development, wallet improvements, education initiatives, privacy enhancements, scaling solutions, and applications that drive Bitcoin adoption. Check each organization&apos;s website for specific funding priorities.
        </p>
      )
    },
    {
      question: "How long does the application review process take?",
      answer: (
        <p>
          Review times vary by organization, typically ranging from a few weeks to a couple of months. Each organization has its own review schedule and process. You&apos;ll be contacted directly by organizations interested in your project.
        </p>
      )
    },
    {
      question: "Can I apply for multiple grants from different organizations?",
      answer: (
        <p>
          Yes! That&apos;s one of the primary benefits of the common application. You can select multiple organizations when applying, and each one will independently review your application. There&apos;s no limit to how many organizations you can apply to through the common application.
        </p>
      )
    }
  ]

  return (
    <div className="mx-auto w-full max-w-3xl divide-y divide-gray-200 rounded-2xl bg-white p-2 gradient-border">
      <h2 className="p-6 text-2xl font-extrabold text-center text-gray-900">
        Frequently Asked Questions
      </h2>
      <dl className="divide-y divide-gray-200">
        {faqs.map((faq, index) => (
          <FaqItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </dl>
    </div>
  )
} 