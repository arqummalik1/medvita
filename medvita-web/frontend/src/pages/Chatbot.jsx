import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm MedVita Bot. I can help you check doctor availability, book appointments, or answer questions about the app. How can I assist you today?", sender: 'bot' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { id: Date.now(), text: input, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // 1. Check for specific commands first (Navigation/Help)
      const lowerInput = userMessage.text.toLowerCase()
      let botResponse = ''
      let isCommand = false

      if (lowerInput.includes('book') && lowerInput.includes('appointment')) {
        botResponse = "You can book an appointment by visiting the Appointments page. Would you like me to take you there? (Link: /dashboard/appointments)"
        isCommand = true
      } else if (lowerInput.includes('doctor') && lowerInput.includes('availability')) {
        // Fetch doctors
        const { data: doctors } = await supabase.from('profiles').select('full_name').eq('role', 'doctor').limit(3)
        const doctorNames = doctors?.map(d => `Dr. ${d.full_name}`).join(', ') || 'our doctors'
        botResponse = `We have ${doctorNames} available. You can check their specific hours on the dashboard.`
        isCommand = true
      }

      if (!isCommand) {
        // 2. Use Gemini API for general queries
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        
        if (apiKey) {
          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ 
                  parts: [{ 
                    text: `You are MedVita Bot, a helpful medical assistant for a clinic management app. 
                    Context: The user is asking: "${userMessage.text}". 
                    Keep the answer concise, professional, and helpful. 
                    If they ask about medical advice, give a general disclaimer.
                    If they ask about app features, explain:
                    - Doctors can manage patients, appointments, and prescriptions.
                    - Patients can book appointments and view prescriptions.
                    ` 
                  }] 
                }]
              })
            })
            
            const data = await response.json()
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
              botResponse = data.candidates[0].content.parts[0].text
            } else {
              throw new Error('Invalid API response')
            }
          } catch (apiError) {
            console.error('Gemini API Error:', apiError)
            // Fallback
            botResponse = "I'm having trouble connecting to my AI brain right now. But I can help you navigate the app!"
          }
        } else {
           // Mock response if no API key
           await new Promise(resolve => setTimeout(resolve, 1000))
           if (lowerInput.includes('help') || lowerInput.includes('support')) {
             botResponse = "I can help with: \n1. Checking doctor availability\n2. Booking appointments\n3. Viewing prescriptions\nJust type what you need!"
           } else {
             botResponse = "I'm not sure I understand. Could you try asking about appointments or doctors? (Add VITE_GEMINI_API_KEY to .env for AI responses)"
           }
        }
      }

      const botMessage = { id: Date.now() + 1, text: botResponse, sender: 'bot' }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sorry, I encountered an error. Please try again.", sender: 'bot' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] glass-panel rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800">
            <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">MedVita Assistant</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Online & Ready to Help
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-end max-w-[85%] sm:max-w-[75%] space-x-3 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
              }`}
            >
              <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center shadow-md border ${
                msg.sender === 'user' 
                  ? 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' 
                  : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}>
                {msg.sender === 'user' ? (
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              
              <div
                className={`rounded-2xl px-5 py-3.5 shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                }`}
              >
                {msg.text}
                {msg.text.includes('/dashboard/appointments') && (
                   <div className="mt-3 pt-3 border-t border-white/20">
                     <Link to="/dashboard/appointments" className="inline-flex items-center text-xs font-bold text-blue-100 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20">
                       Go to Appointments →
                     </Link>
                   </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start pl-[52px]">
             <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 sm:p-5">
        <form onSubmit={handleSend} className="flex gap-3 items-center">
          <input
            type="text"
            className="input-field py-3 shadow-sm bg-slate-50 dark:bg-slate-800/50"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary h-[46px] w-[46px] !p-0 rounded-xl flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
