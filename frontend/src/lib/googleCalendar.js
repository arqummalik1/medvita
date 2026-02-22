/**
 * Google Calendar Integration Service
 * Handles OAuth and calendar event creation
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
const SCOPES = 'https://www.googleapis.com/auth/calendar.events'

let gapiLoaded = false
let gisLoaded = false

// Load Google API scripts
export const loadGoogleAPI = () => {
  return new Promise((resolve, reject) => {
    if (gapiLoaded && gisLoaded) {
      resolve()
      return
    }

    // Load gapi
    if (!gapiLoaded) {
      const gapiScript = document.createElement('script')
      gapiScript.src = 'https://apis.google.com/js/api.js'
      gapiScript.onload = () => {
        gapiLoaded = true
        window.gapi.load('client', () => {
          window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          }).then(() => {
            if (gisLoaded) resolve()
          }).catch(reject)
        })
      }
      gapiScript.onerror = reject
      document.head.appendChild(gapiScript)
    }

    // Load gis
    if (!gisLoaded) {
      const gisScript = document.createElement('script')
      gisScript.src = 'https://accounts.google.com/gsi/client'
      gisScript.onload = () => {
        gisLoaded = true
        if (gapiLoaded) resolve()
      }
      gisScript.onerror = reject
      document.head.appendChild(gisScript)
    }
  })
}

// Initialize Google API
export const initializeGoogleAPI = async () => {
  try {
    await loadGoogleAPI()
    return true
  } catch (error) {
    console.error('Error loading Google API:', error)
    return false
  }
}

// Check if user is signed in
export const isSignedIn = () => {
  return window.gapi?.auth2?.getAuthInstance()?.isSignedIn?.get() || false
}

// Sign in to Google Calendar
export const signInToGoogle = () => {
  return new Promise((resolve, reject) => {
    // Wait for Google API to load
    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(checkGoogle)
        
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error))
            } else {
              // Store access token
              localStorage.setItem('google_calendar_token', response.access_token)
              resolve(response)
            }
          },
        })

        tokenClient.requestAccessToken({ prompt: 'consent' })
      }
    }, 100)

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkGoogle)
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google API failed to load. Please refresh the page.'))
      }
    }, 10000)
  })
}

// Sign out from Google Calendar
export const signOutFromGoogle = () => {
  localStorage.removeItem('google_calendar_token')
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect()
  }
}

// Check if Google Calendar sync is enabled
export const isGoogleCalendarEnabled = () => {
  return localStorage.getItem('google_calendar_enabled') === 'true'
}

// Set Google Calendar sync preference
export const setGoogleCalendarEnabled = (enabled) => {
  localStorage.setItem('google_calendar_enabled', enabled.toString())
}

// Create calendar event
export const createCalendarEvent = async (appointment) => {
  try {
    const token = localStorage.getItem('google_calendar_token')
    if (!token) {
      throw new Error('Not authenticated with Google Calendar')
    }

    // Format date and time
    const startDateTime = new Date(`${appointment.date}T${appointment.time}`)
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000) // 30 minutes

    const event = {
      summary: `Appointment - ${appointment.patient_name || 'Patient'}`,
      description: `Appointment with ${appointment.patient_name || 'Patient'}\nStatus: ${appointment.status}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    }

    // Use fetch API to create event
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to create calendar event')
    }

    const createdEvent = await response.json()
    return createdEvent
  } catch (error) {
    console.error('Error creating calendar event:', error)
    throw error
  }
}

// Generate Google Calendar link (alternative method without OAuth)
export const generateCalendarLink = (appointment) => {
  const startDateTime = new Date(`${appointment.date}T${appointment.time}`)
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000)

  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Appointment - ${appointment.patient_name || 'Patient'}`,
    dates: `${formatDate(startDateTime)}/${formatDate(endDateTime)}`,
    details: `Appointment with ${appointment.patient_name || 'Patient'}\nStatus: ${appointment.status}`,
    location: 'MedVita Healthcare',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
