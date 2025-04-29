import HRFGrantApplicationForm from '../../components/HRFGrantApplicationForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HRF Bitcoin Development Fund Grant Application',
  description: 'Human Rights Foundation Bitcoin Development Fund Grant Application Form'
}

export default function HRFPage() {
  return <HRFGrantApplicationForm />
} 