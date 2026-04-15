import { useState, createContext, useContext } from 'react'
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

interface ShellCtx {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  chatOpen: boolean
  setChatOpen: (v: boolean) => void
}

const ShellContext = createContext<ShellCtx>({
  sidebarOpen: false, setSidebarOpen: () => {},
  chatOpen: false, setChatOpen: () => {},
})

export function useShell() { return useContext(ShellContext) }

const PANEL_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <ShellContext.Provider value={{ sidebarOpen, setSidebarOpen, chatOpen, setChatOpen }}>
      <div className="h-[100dvh] flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 min-h-0 relative">
          <Sidebar />
          <ModulePanel />
          <ChatPanel />
        </div>
        <ChatToggle />
        <AnimatePresence>
          {state.activeModule === 'launch' && <MissionLaunch />}
        </AnimatePresence>
      </div>
    </ShellContext.Provider>
  )
}
