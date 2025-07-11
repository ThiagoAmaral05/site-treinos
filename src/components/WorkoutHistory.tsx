import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function WorkoutHistory() {
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  
  const exercises = useQuery(api.exercises.list) || [];
  const workoutPlans = useQuery(api.workoutPlans.list) || [];
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
    const totalDuration = workoutHistory.reduce((total, session) => total + (session.duration || 0), 0);
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    
    // Calculate average weight across all sets
    let totalWeight = 0;
    let totalSets = 0;
    
    workoutHistory.forEach(session => {
      session.exercises.forEach((ex: any) => {
        ex.sets.forEach((set: any) => {
          if (set.weight > 0) {
            totalWeight += set.weight;
            totalSets++;
          }
        });
      });
    });
    
    const avgWeight = totalSets > 0 ? Math.round(totalWeight / totalSets) : 0;

    return { totalWorkouts, avgWeight, avgDuration };
  };

  // Filter workout history based on selected plan
  const getFilteredHistory = () => {
    if (!selectedPlan) return workoutHistory;
    
    const selectedPlanData = workoutPlans.find(p => p._id === selectedPlan);
    if (!selectedPlanData) return workoutHistory;
    
    const planExerciseIds = selectedPlanData.exercises.map(ex => ex.exerciseId);
    
    return workoutHistory.filter(session => {
      return session.exercises.some((ex: any) => 
        planExerciseIds.includes(ex.exerciseId)
      );
    });
  };

  const stats = getOverallStats();
  const filteredHistory = getFilteredHistory();

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
            <div className="text-3xl font-bold text-green-400">{stats.avgWeight}kg</div>
            <div className="text-sm text-gray-400">Carga Média</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{stats.avgDuration}min</div>
            <div className="text-sm text-gray-400">Duração Média</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-white mb-4">Filtros</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Filtrar por Exercício</label>
            <select
              value={selectedExercise}
              onChange={(e) => {
                setSelectedExercise(e.target.value);
                setSelectedPlan("");
              }}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
            >
              <option value="">Todos os exercícios</option>
              {exercises.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} ({ex.muscleGroup})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Filtrar por Ficha</label>
            <select
              value={selectedPlan}
              onChange={(e) => {
                setSelectedPlan(e.target.value);
                setSelectedExercise("");
              }}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
            >
              <option value="">Todas as fichas</option>
              {workoutPlans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(selectedExercise || selectedPlan) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSelectedExercise("");
                setSelectedPlan("");
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors text-sm"
            >
              Limpar Filtros
            </button>
          </div>
        )}
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

      {/* Plan-filtered History */}
      {selectedPlan && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">
            Histórico da Ficha: {workoutPlans.find(p => p._id === selectedPlan)?.name}
          </h4>
        </div>
      )}

      {/* General Workout History */}
      {!selectedExercise && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">
            {selectedPlan ? `Treinos da Ficha: ${workoutPlans.find(p => p._id === selectedPlan)?.name}` : 'Histórico de Treinos'}
          </h4>
          {filteredHistory.map((session) => (
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

      {filteredHistory.length === 0 && selectedPlan && workoutHistory.length > 0 && (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-white mb-2">Nenhum treino encontrado</h3>
          <p className="text-gray-400 mb-6">
            Não há treinos registrados para a ficha selecionada
          </p>
        </div>
      )}
    </div>
  );
}