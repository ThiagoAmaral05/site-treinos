import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Segunda-feira", short: "SEG" },
  { value: "tuesday", label: "Terça-feira", short: "TER" },
  { value: "wednesday", label: "Quarta-feira", short: "QUA" },
  { value: "thursday", label: "Quinta-feira", short: "QUI" },
  { value: "friday", label: "Sexta-feira", short: "SEX" },
  { value: "saturday", label: "Sábado", short: "SAB" },
  { value: "sunday", label: "Domingo", short: "DOM" },
];

export function WorkoutLogger() {
  // Get today's date in local timezone to avoid timezone issues
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getLocalDateString();
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [duration, setDuration] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [workoutStarted, setWorkoutStarted] = useState(false);

  const exercises = useQuery(api.exercises.list) || [];
  const workoutPlans = useQuery(api.workoutPlans.list) || [];
  const todaySession = useQuery(api.workoutSessions.getByDate, { date: selectedDate });
  const saveSession = useMutation(api.workoutSessions.save);
  const deleteSession = useMutation(api.workoutSessions.remove);

  useEffect(() => {
    if (todaySession) {
      setDuration(todaySession.duration || 0);
      setNotes(todaySession.notes || "");
      setWorkoutExercises(todaySession.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exercise: ex.exercise,
        sets: ex.sets,
      })));
      setWorkoutStarted(true);
    } else {
      // Reset everything when no session exists
      setDuration(0);
      setNotes("");
      setWorkoutExercises([]);
      setWorkoutStarted(false);
      setSelectedPlan("");
    }
  }, [todaySession]);

  const startPlanWorkout = (planId: string) => {
    const plan = workoutPlans.find(p => p._id === planId);
    if (!plan) return;

    const planWorkoutExercises = plan.exercises.map(planEx => {
      const exercise = exercises.find(ex => ex._id === planEx.exerciseId);
      return {
        exerciseId: planEx.exerciseId,
        exercise,
        sets: Array.from({ length: planEx.sets }, () => ({
          reps: parseInt(planEx.reps.split('-')[0]) || 0,
          weight: planEx.weight || 0,
          completed: false,
        })),
        planNotes: planEx.notes,
      };
    });

    setWorkoutExercises(planWorkoutExercises);
    setSelectedPlan(planId);
    setWorkoutStarted(true);
    toast.success(`Ficha "${plan.name}" carregada!`);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets.push({ reps: 0, weight: 0, completed: false });
    setWorkoutExercises(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets[setIndex] = {
      ...updated[exerciseIndex].sets[setIndex],
      [field]: value,
    };
    setWorkoutExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_: any, i: number) => i !== setIndex);
    setWorkoutExercises(updated);
  };

  const handleSave = async () => {
    try {
      const validExercises = workoutExercises.filter(ex => ex.exerciseId && ex.sets.length > 0);
      
      await saveSession({
        date: selectedDate,
        duration: duration || undefined,
        exercises: validExercises.map(ex => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
        })),
        notes: notes || undefined,
      });

      toast.success("Treino salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar treino");
    }
  };

  const clearWorkout = async () => {
    if (confirm("Tem certeza que deseja excluir o treino atual? Esta ação não pode ser desfeita.")) {
      try {
        // If there's an existing session, delete it from the database
        if (todaySession) {
          await deleteSession({ id: todaySession._id });
          toast.success("Treino excluído com sucesso!");
        }
        
        // Reset all local state
        setWorkoutExercises([]);
        setSelectedPlan("");
        setDuration(0);
        setNotes("");
        setWorkoutStarted(false);
      } catch (error) {
        toast.error("Erro ao excluir treino");
      }
    }
  };

  const getTotalVolume = () => {
    return workoutExercises.reduce((total, ex) => {
      return total + ex.sets.reduce((setTotal: number, set: any) => {
        return setTotal + (set.reps * set.weight);
      }, 0);
    }, 0);
  };

  const getCompletedSets = () => {
    return workoutExercises.reduce((total, ex) => {
      return total + ex.sets.filter((set: any) => set.completed).length;
    }, 0);
  };

  const getTotalSets = () => {
    return workoutExercises.reduce((total, ex) => {
      return total + ex.sets.length;
    }, 0);
  };

  const getDayLabel = (dayValue: string) => {
    return DAYS_OF_WEEK.find(d => d.value === dayValue)?.label || dayValue;
  };

  const getSelectedPlanName = () => {
    const plan = workoutPlans.find(p => p._id === selectedPlan);
    return plan?.name || "";
  };

  // If workout hasn't started, show the start screen
  if (!workoutStarted) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">Treino do Dia</h3>
              <p className="text-sm text-gray-400">Escolha uma ficha de treino para começar</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Plan Selection Header */}
        <div className="text-center py-8 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-6xl mb-4">💪</div>
          <h3 className="text-lg font-medium text-white mb-2">Pronto para treinar?</h3>
          <p className="text-gray-400">
            Escolha uma das suas fichas de treino para começar
          </p>
        </div>

        {/* Plan Selection */}
        {workoutPlans.length > 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-medium text-white mb-4">Escolha uma Ficha de Treino</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workoutPlans.map((plan) => {
                const dayLabel = getDayLabel(plan.exercises[0]?.dayOfWeek);
                
                return (
                  <div key={plan._id} className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-colors">
                    <h5 className="font-medium text-white mb-2">{plan.name}</h5>
                    <p className="text-sm text-gray-400 mb-1">
                      {plan.exercises.length} exercícios
                    </p>
                    <p className="text-sm text-blue-400 mb-3">
                      {dayLabel}
                    </p>
                    <button
                      onClick={() => startPlanWorkout(plan._id)}
                      className="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Usar Esta Ficha
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma ficha de treino disponível</h3>
            <p className="text-gray-400 mb-6">
              Crie suas fichas de treino na aba "Fichas" para começar a treinar
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">Treino em Andamento</h3>
            <p className="text-sm text-gray-400">Ficha: {getSelectedPlanName()}</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
            />
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <span className="mr-2">💾</span>
              Salvar Treino
            </button>
          </div>
        </div>

        {/* Stats */}
        {workoutExercises.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{workoutExercises.length}</div>
              <div className="text-xs text-gray-400">Exercícios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{getCompletedSets()}/{getTotalSets()}</div>
              <div className="text-xs text-gray-400">Séries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{getTotalVolume().toFixed(0)}kg</div>
              <div className="text-xs text-gray-400">Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{duration}min</div>
              <div className="text-xs text-gray-400">Duração</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-600 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            🎯 Usando ficha de treino
          </div>
          <button
            onClick={clearWorkout}
            className="text-red-400 hover:text-red-300 text-sm px-3 py-1 border border-red-400 rounded hover:bg-red-400/10 transition-colors"
          >
            Excluir Treino
          </button>
        </div>
      </div>

      {/* Workout Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-white mb-4">Informações do Treino</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Duração (minutos)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400"
              placeholder="Ex: 60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Observações</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400"
              placeholder="Como foi o treino hoje?"
            />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {workoutExercises.map((workoutEx, exerciseIndex) => (
          <div key={exerciseIndex} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1">
                <h5 className="text-lg font-medium text-white">{workoutEx.exercise?.name}</h5>
                <p className="text-sm text-gray-400">{workoutEx.exercise?.muscleGroup}</p>
              </div>
            </div>

            {workoutEx.planNotes && (
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                <p className="text-sm text-blue-200">💡 {workoutEx.planNotes}</p>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium text-white">Séries</h5>
                <button
                  onClick={() => addSet(exerciseIndex)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  + Série
                </button>
              </div>

              <div className="space-y-3">
                {workoutEx.sets.map((set: any, setIndex: number) => (
                  <div key={setIndex} className="flex items-center gap-3 bg-gray-700 p-4 rounded-lg">
                    <span className="text-sm font-medium w-12 text-center text-white">
                      #{setIndex + 1}
                    </span>
                    
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">Repetições</label>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, "reps", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-600 text-white"
                        min="0"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">Carga (kg)</label>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, "weight", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-600 text-white"
                        step="0.5"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={set.completed}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, "completed", e.target.checked)}
                          className="mr-2 w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-white">Concluída</span>
                      </label>
                    </div>

                    <button
                      onClick={() => removeSet(exerciseIndex, setIndex)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}