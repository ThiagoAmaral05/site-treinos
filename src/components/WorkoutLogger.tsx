import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function WorkoutLogger() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [duration, setDuration] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);

  const exercises = useQuery(api.exercises.list) || [];
  const todaySession = useQuery(api.workoutSessions.getByDate, { date: selectedDate });
  const saveSession = useMutation(api.workoutSessions.save);

  useEffect(() => {
    if (todaySession) {
      setDuration(todaySession.duration || 0);
      setNotes(todaySession.notes || "");
      setWorkoutExercises(todaySession.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exercise: ex.exercise,
        sets: ex.sets,
      })));
    } else {
      setDuration(0);
      setNotes("");
      setWorkoutExercises([]);
    }
  }, [todaySession]);

  const addExercise = () => {
    setWorkoutExercises([
      ...workoutExercises,
      {
        exerciseId: "",
        exercise: null,
        sets: [{ reps: 0, weight: 0, completed: false }],
      },
    ]);
  };

  const updateExercise = (index: number, exerciseId: string) => {
    const exercise = exercises.find(ex => ex._id === exerciseId);
    const updated = [...workoutExercises];
    updated[index] = {
      ...updated[index],
      exerciseId,
      exercise,
    };
    setWorkoutExercises(updated);
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

  const removeExercise = (index: number) => {
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== index));
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

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">Treino do Dia</h3>
            <p className="text-sm text-gray-400">Registre seu treino e acompanhe seu progresso</p>
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
                <select
                  value={workoutEx.exerciseId}
                  onChange={(e) => updateExercise(exerciseIndex, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                >
                  <option value="">Selecione um exercício...</option>
                  {exercises.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.name} ({ex.muscleGroup})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => removeExercise(exerciseIndex)}
                className="ml-4 text-red-400 hover:text-red-300 p-2"
              >
                🗑️
              </button>
            </div>

            {workoutEx.exerciseId && (
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
            )}
          </div>
        ))}

        <button
          onClick={addExercise}
          className="w-full border-2 border-dashed border-gray-600 rounded-lg p-8 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
        >
          <div className="text-4xl mb-2">+</div>
          <div>Adicionar Exercício</div>
        </button>
      </div>

      {workoutExercises.length === 0 && (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-white mb-2">Pronto para treinar?</h3>
          <p className="text-gray-400 mb-6">Adicione exercícios e registre suas séries para acompanhar seu progresso</p>
          <button
            onClick={addExercise}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Começar Treino
          </button>
        </div>
      )}
    </div>
  );
}
