<script setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import JobsTable from '../../components/JobsTable.vue'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from '../../composables/nitroSyncApi'
import { getNitroSyncEmployees } from '../../composables/useNitroSyncEmployees'

const jobs = ref([])
const jobsGetAllEndpoint = buildNitroSyncEndpoint('/v1/jobs/get-all')
const jobGetOneEndpoint = buildNitroSyncEndpoint('/v1/jobs/get-one')
const departmentsGetAllEndpoint = buildNitroSyncEndpoint('/v1/departments/get-all')
const defaultCompanyId = 'b00af2a4-2d77-432b-bd93-4e7ea120d154'

const normalizeValue = (value) => String(value ?? '').trim()
const normalizeLookupKey = (value) => normalizeValue(value).toLowerCase()

const getStoredCompanyId = () => {
  const storageKeys = [
    'nitrosync-user',
    'nitrosync-profile',
    'user',
    'profile',
    'auth-user',
    'currentUser',
  ]

  for (const key of storageKeys) {
    for (const storage of [globalThis.localStorage, globalThis.sessionStorage]) {
      try {
        const rawValue = storage?.getItem?.(key)
        if (!rawValue) continue

        const parsed = JSON.parse(rawValue)
        const companyId = normalizeValue(
          parsed?.related_company
          ?? parsed?.company_uuid
          ?? parsed?.company?.uuid
          ?? parsed?.company?.company_uuid
          ?? parsed?.organization_uuid
          ?? parsed?.organization?.uuid,
        )

        if (companyId) {
          return companyId
        }
      } catch {
        continue
      }
    }
  }

  return defaultCompanyId
}

const toArray = (value) => (Array.isArray(value) ? value : [])

const buildDepartmentLookup = (departments = []) => {
  const lookup = new Map()

  departments.forEach((department) => {
    if (!department || typeof department !== 'object') return

    const id = normalizeValue(department.id ?? department.department_id ?? department.uuid)
    const name = normalizeValue(department.department_name ?? department.name)

    if (id) {
      lookup.set(id, department)
    }

    if (name) {
      lookup.set(normalizeLookupKey(name), department)
    }
  })

  return lookup
}

const getEmployeeName = (employee = {}) => {
  const additionalInfo =
    employee?.employee_additional_information
    ?? employee?.employeeAdditionalInformation
    ?? {}
  const fullName = normalizeValue(
    employee?.full_name
    ?? employee?.fullName
    ?? employee?.employee_name
    ?? employee?.employeeName
    ?? employee?.name,
  )
  const firstName = normalizeValue(
    employee?.first_name
    ?? employee?.firstName
    ?? additionalInfo?.first_name
    ?? additionalInfo?.firstName,
  )
  const lastName = normalizeValue(
    employee?.last_name
    ?? employee?.lastName
    ?? additionalInfo?.last_name
    ?? additionalInfo?.lastName,
  )

  return fullName || [firstName, lastName].filter(Boolean).join(' ').trim()
}

const getEmployeeUuid = (employee = {}) =>
  normalizeValue(
    employee?.employee_uuid
    ?? employee?.employeeUuid
    ?? employee?.user_uuid
    ?? employee?.userUuid
    ?? employee?.uuid
    ?? employee?.user_id
    ?? employee?.userId
    ?? employee?.employee_additional_information?.employee_uuid
    ?? employee?.employeeAdditionalInformation?.employee_uuid,
  )

const buildEmployeeLookup = (employees = []) => {
  const lookup = new Map()

  employees.forEach((employee) => {
    if (!employee || typeof employee !== 'object') return

    const uuid = getEmployeeUuid(employee)
    const name = getEmployeeName(employee)

    if (uuid) {
      lookup.set(uuid, employee)
    }

    if (name) {
      lookup.set(normalizeLookupKey(name), employee)
    }
  })

  return lookup
}

const getHiringTeamEntries = (job = {}) => {
  const normalizeEntries = (value) => {
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') return [value]
    return []
  }

  return [
    ...normalizeEntries(job?.job_hiring_team),
    ...normalizeEntries(job?.hiring_team),
  ]
}

const getRecruiterObjectCandidates = (job = {}) => [
  job?.recruiter,
  job?.assigned_recruiter,
  ...getHiringTeamEntries(job).flatMap((entry) => [
    entry?.recruiter,
    entry?.assigned_recruiter,
    entry?.employee,
    entry?.user,
  ]),
].filter((value) => value && typeof value === 'object')

const getRecruiterIdentifiersFromObject = (recruiter = {}) => [
  recruiter?.employee_uuid,
  recruiter?.employeeUuid,
  recruiter?.user_uuid,
  recruiter?.userUuid,
  recruiter?.uuid,
  recruiter?.user_id,
  recruiter?.userId,
  recruiter?.id,
  recruiter?.employee_id,
  recruiter?.employeeId,
].map(normalizeValue).filter(Boolean)

const getRecruiterNamesFromObject = (recruiter = {}) => [
  getEmployeeName(recruiter),
  recruiter?.username,
  recruiter?.email,
].map(normalizeValue).filter(Boolean)

const getJobDepartmentCandidates = (job = {}) => [
  job?.department_id,
  job?.department?.id,
  job?.department?.department_id,
  job?.job?.department_id,
  job?.job?.department?.id,
  job?.model?.department_id,
  job?.model?.department?.id,
  job?.job_model?.department_id,
  job?.job_model?.department?.id,
  job?.raw?.department_id,
  job?.raw?.department?.id,
  job?.details?.department_id,
  job?.details?.department?.id,
  typeof job?.department === 'string' ? job.department : '',
  job?.department?.department_name,
  job?.department_name,
  job?.job_details?.department,
  job?.job_posting?.department,
].map(normalizeValue).filter(Boolean)

const getJobRecruiterCandidates = (job = {}) => {
  const recruiterObjects = getRecruiterObjectCandidates(job)
  const hiringTeamEntries = getHiringTeamEntries(job)

  return [
    job?.recruiter_uuid,
    job?.recruiter_id,
    job?.recruiter_name,
    job?.assigned_recruiter_uuid,
    job?.assigned_recruiter_id,
    typeof job?.recruiter === 'string' ? job.recruiter : '',
    typeof job?.assigned_recruiter === 'string' ? job.assigned_recruiter : '',
    ...hiringTeamEntries.flatMap((entry) => [
      entry?.recruiter_uuid,
      entry?.recruiter_id,
      entry?.employee_uuid,
      entry?.employeeUuid,
      entry?.employee_id,
      entry?.employeeId,
      entry?.user_uuid,
      entry?.userUuid,
      entry?.user_id,
      entry?.userId,
      entry?.recruiter_name,
      typeof entry?.recruiter === 'string' ? entry.recruiter : '',
      typeof entry?.assigned_recruiter === 'string' ? entry.assigned_recruiter : '',
    ]),
    ...recruiterObjects.flatMap((recruiter) => [
      ...getRecruiterIdentifiersFromObject(recruiter),
      ...getRecruiterNamesFromObject(recruiter),
    ]),
  ].map(normalizeValue).filter(Boolean)
}

const getJobRecruiterDisplayCandidates = (job = {}) => {
  const recruiterObjects = getRecruiterObjectCandidates(job)
  const hiringTeamEntries = getHiringTeamEntries(job)

  return [
    job?.recruiter_name,
    typeof job?.recruiter === 'string' ? job.recruiter : '',
    typeof job?.assigned_recruiter === 'string' ? job.assigned_recruiter : '',
    ...hiringTeamEntries.flatMap((entry) => [
      entry?.recruiter_name,
      typeof entry?.recruiter === 'string' ? entry.recruiter : '',
      typeof entry?.assigned_recruiter === 'string' ? entry.assigned_recruiter : '',
    ]),
    ...recruiterObjects.flatMap((recruiter) => getRecruiterNamesFromObject(recruiter)),
  ].map(normalizeValue).filter(Boolean)
}

const hasRecruiterData = (job = {}) => getJobRecruiterCandidates(job).length > 0
const hasRecruiterDisplayData = (job = {}) => getJobRecruiterDisplayCandidates(job).length > 0

const enrichJobsWithDepartments = (jobRows = [], departmentRows = []) => {
  const departmentLookup = buildDepartmentLookup(departmentRows)

  return jobRows.map((job) => {
    if (!job || typeof job !== 'object') {
      return job
    }

    const existingDepartment =
      job.department && typeof job.department === 'object'
        ? job.department
        : null

    if (normalizeValue(existingDepartment?.department_name ?? existingDepartment?.name)) {
      return job
    }

    const matchedDepartment = getJobDepartmentCandidates(job)
      .map((candidate) => departmentLookup.get(candidate) ?? departmentLookup.get(normalizeLookupKey(candidate)))
      .find(Boolean)

    if (!matchedDepartment) {
      return job
    }

    return {
      ...job,
      department: matchedDepartment,
      department_id: normalizeValue(job.department_id ?? matchedDepartment.id ?? matchedDepartment.department_id),
      department_name: normalizeValue(job.department_name ?? matchedDepartment.department_name ?? matchedDepartment.name),
    }
  })
}

const enrichJobsWithRecruiters = (jobRows = [], employeeRows = []) => {
  const employeeLookup = buildEmployeeLookup(employeeRows)

  return jobRows.map((job) => {
    if (!job || typeof job !== 'object') {
      return job
    }

    const matchedRecruiter = getJobRecruiterCandidates(job)
      .map((candidate) => employeeLookup.get(candidate) ?? employeeLookup.get(normalizeLookupKey(candidate)))
      .find(Boolean)

    if (!matchedRecruiter) {
      return job
    }

    const recruiterName = getEmployeeName(matchedRecruiter)
    const recruiterUuid = getEmployeeUuid(matchedRecruiter)

    return {
      ...job,
      recruiter: matchedRecruiter,
      recruiter_uuid: normalizeValue(job.recruiter_uuid ?? recruiterUuid),
      recruiter_name: normalizeValue(job.recruiter_name ?? recruiterName),
    }
  })
}

const fetchJobDetails = async (job, relatedCompany) => {
  const jobUuid = normalizeValue(job?.job_uuid ?? job?.uuid)
  if (!jobUuid || !relatedCompany) {
    return job
  }

  try {
    const response = await axios.post(
      jobGetOneEndpoint,
      {
        job_uuid: jobUuid,
        related_company: relatedCompany,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: nitroSyncRequestTimeoutMs,
      },
    )

    const details = response?.data?.data
    return details && typeof details === 'object'
      ? {
          ...job,
          ...details,
        }
      : job
  } catch (error) {
    console.error('Failed to load job details for recruiter mapping:', {
      jobUuid,
      relatedCompany,
      error,
    })
    return job
  }
}

const hydrateJobsMissingRecruiters = async (jobRows = [], relatedCompany) => {
  const rowsMissingRecruiters = jobRows.filter((job) =>
    !hasRecruiterDisplayData(job) || !hasRecruiterData(job),
  )

  if (!rowsMissingRecruiters.length) {
    return jobRows
  }

  const detailedRows = await Promise.all(
    rowsMissingRecruiters.map((job) => fetchJobDetails(job, relatedCompany)),
  )

  const detailsByUuid = new Map(
    detailedRows.map((job) => [
      normalizeValue(job?.job_uuid ?? job?.uuid),
      job,
    ]),
  )

  return jobRows.map((job) =>
    detailsByUuid.get(normalizeValue(job?.job_uuid ?? job?.uuid)) || job,
  )
}

const fetchDepartments = async (relatedCompany) => {
  const response = await axios.post(
    departmentsGetAllEndpoint,
    {
      related_company: relatedCompany,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: nitroSyncRequestTimeoutMs,
    },
  )

  const departmentRows = response?.data?.data
  return toArray(departmentRows)
}

const fetchEmployees = async (relatedCompany) => {
  const response = await getNitroSyncEmployees(relatedCompany, {
    timeout: nitroSyncRequestTimeoutMs,
  })

  return toArray(response?.data)
}

const fetchJobs = async () => {
  const relatedCompany = getStoredCompanyId()

  if (!relatedCompany) {
    jobs.value = []
    return
  }

  try {
    const [jobsResponse, departmentRows, employeeRows] = await Promise.all([
      axios.post(
        jobsGetAllEndpoint,
        {
          related_company: relatedCompany,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: nitroSyncRequestTimeoutMs,
        },
      ),
      fetchDepartments(relatedCompany).catch((error) => {
        console.error('Failed to load departments for jobs list:', error)
        return []
      }),
      fetchEmployees(relatedCompany).catch((error) => {
        console.error('Failed to load employees for jobs list:', error)
        return []
      }),
    ])

    const jobRows = toArray(jobsResponse?.data?.data)
    const hydratedJobRows = await hydrateJobsMissingRecruiters(jobRows, relatedCompany)
    const jobsWithDepartments = enrichJobsWithDepartments(hydratedJobRows, departmentRows)
    jobs.value = enrichJobsWithRecruiters(jobsWithDepartments, employeeRows)
  } catch (error) {
    console.error(error)
    jobs.value = []
  }
}

onMounted(() => {
  fetchJobs()
})
</script>

<template>
  <div class="page-container jobs-page-container">
    <div class="breadcrumb-row">
      <span class="crumb-home"></span>
      <span class="breadcrumb-sep"></span>
      <span class="breadcrumb-text">Jobs</span>
    </div>

    <JobsTable :jobs="jobs" @refresh-jobs="fetchJobs" />
  </div>
</template>
