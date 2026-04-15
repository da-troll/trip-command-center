import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTrip } from './context'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { MissionLaunch } from './components/MissionLaunch'
import { ChatPanel, ChatToggle } from './components/ChatPanel'
import { Setup } from './components/modules/Setup'
import { Groups } from './components/modules/Groups'
import { Routes } from './components/modules/Routes'
import { Itinerary } from './components/modules/Itinerary'
import { Meals } from './components/modules/Meals'
import { Expenses } from './components/modules/Expenses'

const PANEL_VARIANTS = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
}

function ModulePanel() {
  const { state } = useTrip()

  const panels: Record<string, React.ReactNode> = {
    setup: <Setup />,
    groups: <Groups />,
    routes: <Routes />,
    itinerary: <Itinerary />,
    meals: <Meals />,
    expenses: <Expenses />,
  }

  const active = state.activeModule === 'launch' ? 'setup' : state.activeModule
  const panel = panels[active] ?? <Setup />

  return (
    <div className="flex-1 overflow-y-auto min-w-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          variants={PANEL_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          {panel}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  const { state } = useTrip()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <ModulePanel />
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
      <ChatToggle open={chatOpen} onToggle={() => setChatOpen(p => !p)} />
      <AnimatePresence>
        {state.activeModule === 'launch' && <MissionLaunch />}
      </AnimatePresence>
    </div>
  )
}
