import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { ExerciseManager } from "./ExerciseManager";
import { WorkoutPlanner } from "./WorkoutPlanner";
import { WorkoutLogger } from "./WorkoutLogger";
import { WorkoutHistory } from "./WorkoutHistory";

type Tab = "exercises" | "planner" | "logger" | "history";

export function GymTracker() {
  const [activeTab, setActiveTab] = useState<Tab>("logger");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const tabs = [
    { id: "logger" as Tab, label: "Treino Hoje", icon: "📝", description: "Registre seu treino atual" },
    { id: "exercises" as Tab, label: "Exercícios", icon: "🏋️", description: "Gerencie seus exercícios" },
    { id: "planner" as Tab, label: "Fichas de Treino", icon: "📋", description: "Crie e edite fichas" },
    { id: "history" as Tab, label: "Histórico", icon: "📊", description: "Veja seu progresso" },
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-blue-400">💪 Gym Tracker</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span className="text-xl mr-3">{tab.icon}</span>
                <div>
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {loggedInUser?.name?.charAt(0) || loggedInUser?.email?.charAt(0) || 'U'}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-white">
                  {loggedInUser?.name || 'Usuário'}
                </div>
                <div className="text-xs text-gray-400">
                  {loggedInUser?.email}
                </div>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <span className="text-2xl mr-2">{currentTab?.icon}</span>
                  {currentTab?.label}
                </h2>
                <p className="text-sm text-gray-400">{currentTab?.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  Bem-vindo, {loggedInUser?.name || 'Usuário'}!
                </div>
                <div className="text-xs text-gray-400">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm lg:hidden">
                {loggedInUser?.name?.charAt(0) || loggedInUser?.email?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === "exercises" && <ExerciseManager />}
            {activeTab === "planner" && <WorkoutPlanner />}
            {activeTab === "logger" && <WorkoutLogger />}
            {activeTab === "history" && <WorkoutHistory />}
          </div>
        </main>
      </div>
    </div>
  );
}
