import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function WorkoutHistory() {
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  
  const exercises = useQuery(api.exercises.list) || [];
  const workoutHistory = useQuery(api.workoutSessions.getHistory, { limit: 30 }) || [];
  const exerciseHistory = useQuery(
    api.workoutSessions.getExerciseHistory,
    selectedExercise ? { exerciseId: selectedExercise as any } : "skip"
  ) || [];
  const deleteSession = useMutation(api.workoutSessions.remove);

  const formatDate = (dateString: string) => {
    // Parse the date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const handleDeleteSession = async (sessionId: string, sessionDate: string) => {
    if (confirm(`Tem certeza que deseja excluir o treino do dia ${formatDate(sessionDate)}? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteSession({ id: sessionId as any });
        toast.success("Treino excluído com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir treino");
      }
    }
  };

  const getTotalVolume = (session: any) => {
    return session.exercises.reduce((total: number, ex: any) => {
      return total + ex.sets.reduce((setTotal: number, set: any) => {
        return setTotal + (set.reps * set.weight);
      }, 0);
    }, 0);
  };

  const getOverallStats = () => {
    const totalWorkouts = workoutHistory.length;
    const totalVolume = workoutHistory.reduce((total, session) => total + getTotalVolume(session), 0);
    const totalDuration = workoutHistory.reduce((total, session) => total + (session.duration || 0), 0);
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

    return { totalWorkouts, totalVolume, avgDuration };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Estatísticas Gerais</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.totalWorkouts}</div>
            <div className="text-sm text-gray-400">Treinos Realizados</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{stats.totalVolume.toFixed(0)}kg</div>
            <div className="text-sm text-gray-400">Volume Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{stats.avgDuration}min</div>
            <div className="text-sm text-gray-400">Duração Média</div>
          </div>
        </div>
      </div>

      {/* Exercise History Filter */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-white mb-4">Filtrar por Exercício</h4>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full md:w-1/2 px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
        >
          <option value="">Todos os treinos</option>
          {exercises.map((ex) => (
            <option key={ex._id} value={ex._id}>
              {ex.name} ({ex.muscleGroup})
            </option>
          ))}
        </select>
      </div>

      {/* Exercise-specific History */}
      {selectedExercise && exerciseHistory.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">
            Histórico: {exercises.find(ex => ex._id === selectedExercise)?.name}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exerciseHistory.map((record, index) => {
              if (!record) return null;
              return (
                <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="font-medium text-blue-400 mb-3 text-center">
                    {formatDate(record.date)}
                  </div>
                  <div className="space-y-2">
                    {record.sets.map((set: any, setIndex: number) => (
                      <div key={setIndex} className="flex justify-between items-center text-sm bg-gray-700 p-2 rounded">
                        <span className="text-gray-300">Série {setIndex + 1}</span>
                        <span className="text-white font-medium">{set.reps} × {set.weight}kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* General Workout History */}
      {!selectedExercise && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Histórico de Treinos</h4>
          {workoutHistory.map((session) => (
            <div key={session._id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h5 className="text-lg font-semibold text-white">
                    {formatDate(session.date)}
                  </h5>
                  <div className="text-sm text-gray-400 flex flex-wrap gap-4 mt-1">
                    {session.duration && <span>⏱️ {session.duration} min</span>}
                    <span>💪 {session.exercises.length} exercícios</span>
                    <span>📊 {getTotalVolume(session).toFixed(0)}kg volume</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <button
                    onClick={() => handleDeleteSession(session._id, session.date)}
                    className="text-red-400 hover:text-red-300 text-sm py-2 px-3 border border-red-400 rounded hover:bg-red-400/10 transition-colors"
                    title="Excluir treino"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>

              {session.notes && (
                <div className="bg-yellow-900/30 border border-yellow-700/50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-yellow-200">📝 {session.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {session.exercises.map((ex: any, index: number) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg">
                    <h6 className="font-medium mb-2 text-white">
                      {ex.exercise?.name}
                      <span className="text-sm text-gray-400 ml-2">
                        ({ex.exercise?.muscleGroup})
                      </span>
                    </h6>
                    <div className="space-y-1">
                      {ex.sets.map((set: any, setIndex: number) => (
                        <div key={setIndex} className="text-sm flex justify-between items-center text-gray-300 bg-gray-600 p-2 rounded">
                          <span>Série {setIndex + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{set.reps} × {set.weight}kg</span>
                            {set.completed && <span className="text-green-400">✅</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {workoutHistory.length === 0 && (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-white mb-2">Nenhum treino registrado</h3>
          <p className="text-gray-400 mb-6">Comece registrando seus treinos para acompanhar seu progresso</p>
        </div>
      )}
    </div>
  );
}