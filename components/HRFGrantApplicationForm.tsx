"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import Link from 'next/link'
import organizations from '../config/organizations'
import Image from 'next/image'

// Import the shared GrantApplicationForm component
import GrantApplicationForm from './GrantApplicationForm'

type FormData = {
  organizations: string[];
  project_name: string;
  name: string;
  email: string;
  project_focus: string;
  pseudonym: string;
  detailed_description: string;
  short_description: string;
  hrf_mission_relation: string;
  why_fund: string;
  measure_success: string;
  project_links: string;
  is_open_source: string;
  annual_budget: string;
  funding_amount: string;
  funding_usage: string;
  prior_funding: string;
  social_media: string;
  references: string;
  additional_info: string;
}

export default function HRFGrantApplicationForm() {
  return (
    <div className="flex flex-col items-center py-6 px-3">
      <div className="w-full max-w-4xl flex flex-col items-center mb-8">
        <div className="mb-6">
          <Image 
            src="/images/hrf-logo.png"
            alt="Human Rights Foundation Logo"
            width={140}
            height={80}
            className="h-auto"
          />
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-center">Human Rights Foundation Grant Application</h1>
        
        <p className="text-gray-700 mb-4 text-center">
          The Human Rights Foundation focuses on supporting projects that advance human rights 
          through Bitcoin and open-source technology.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 w-full">
          <p className="text-sm text-blue-800">
            This application will be reviewed by the Human Rights Foundation team. Please refer to 
            <Link href="https://hrf.org/programs" className="text-blue-600 hover:underline"> HRF's programs </Link> 
            for more information about their focus areas.
          </p>
        </div>
      </div>

      <GrantApplicationForm preselectedOrgs={['hrf']} />
    </div>
  )
} 