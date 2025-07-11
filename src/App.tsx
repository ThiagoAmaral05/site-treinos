import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { GymTracker } from "./components/GymTracker";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <main className="flex-1">
        <Content />
      </main>
      <Toaster theme="dark" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.users.getCurrentUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        <GymTracker />
      </Authenticated>
      
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Gym Tracker</h1>
              <p className="text-xl text-gray-400">Faça login para começar a acompanhar seus treinos</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
