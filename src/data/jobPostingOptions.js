export const departmentOptions = [
  'Administration',
  'Customer Success',
  'Data & Analytics',
  'Design',
  'Engineering',
  'Finance',
  'Human Resources',
  'Legal',
  'Marketing',
  'Operations',
  'Product',
  'Project Management',
  'Quality Assurance',
  'Sales',
  'Supply Chain',
]

export const countryCityOptions = {
  Jordan: ['Amman', 'Irbid', 'Zarqa', 'Aqaba', 'Madaba'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar'],
  UAE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain'],
  Egypt: ['Cairo', 'Alexandria', 'Giza', 'Mansoura', 'Hurghada'],
  Qatar: ['Doha', 'Al Wakrah', 'Al Khor', 'Lusail'],
  Kuwait: ['Kuwait City', 'Hawalli', 'Al Ahmadi', 'Farwaniya'],
  Bahrain: ['Manama', 'Muharraq', 'Riffa', 'Isa Town'],
  Oman: ['Muscat', 'Salalah', 'Sohar', 'Nizwa'],
  Lebanon: ['Beirut', 'Tripoli', 'Sidon', 'Jounieh'],
  Iraq: ['Baghdad', 'Basra', 'Erbil', 'Mosul'],
  Palestine: ['Ramallah', 'Nablus', 'Hebron', 'Gaza'],
  Morocco: ['Casablanca', 'Rabat', 'Marrakesh', 'Tangier'],
  Tunisia: ['Tunis', 'Sfax', 'Sousse', 'Bizerte'],
  Algeria: ['Algiers', 'Oran', 'Constantine', 'Annaba'],
  Turkey: ['Istanbul', 'Ankara', 'Izmir', 'Bursa'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
  France: ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds'],
  'United States': ['New York', 'San Francisco', 'Chicago', 'Austin'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'],
}

export const countryOptions = Object.keys(countryCityOptions)
  .filter((country, index, list) => list.indexOf(country) === index && country !== 'UAE')

export const degreeOptions = [
  'High School',
  'Diploma',
  'Associate',
  'Bachelor',
  'Master',
  'MBA',
  'PhD',
  'Professional Certification',
]

export const careerLevelOptions = [
  'Internship',
  'Entry Level',
  'Junior',
  'Mid Level',
  'Mid-Senior Level',
  'Senior Level',
  'Lead',
  'Manager',
  'Director',
  'VP / Executive',
]

export const industryOptions = [
  'Accounting',
  'Automotive',
  'Banking',
  'Construction',
  'Consulting',
  'E-commerce',
  'Education',
  'Energy',
  'Financial Services',
  'Government',
  'Healthcare',
  'Hospitality',
  'Insurance',
  'Logistics',
  'Manufacturing',
  'Media',
  'Real Estate',
  'Retail',
  'Technology',
  'Telecommunications',
]

export const contractOptions = [
  'Full time',
  'Part time',
  'Contract',
  'Temporary',
  'Freelance',
  'Internship',
  'Remote',
]

export const currencyOptions = [
  'USD',
  'EUR',
  'GBP',
  'SAR',
  'AED',
  'JOD',
  'EGP',
  'QAR',
  'KWD',
  'BHD',
  'OMR',
  'TRY',
  'CAD',
]

export const salaryOptions = [
  '$0',
  '$1000',
  '$2000',
  '$3000',
  '$4000',
  '$5000',
  '$6000',
  '$7000',
  '$8000',
  '$9000',
  '$10000',
]
