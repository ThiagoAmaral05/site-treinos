import { useState } from "react";
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

export function WorkoutPlanner() {
  const exercises = useQuery(api.exercises.list) || [];
  const workoutPlans = useQuery(api.workoutPlans.list) || [];
  const createPlan = useMutation(api.workoutPlans.create);
  const updatePlan = useMutation(api.workoutPlans.update);
  const removePlan = useMutation(api.workoutPlans.remove);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [planExercises, setPlanExercises] = useState<any[]>([]);

  const addExercise = () => {
    setPlanExercises([
      ...planExercises,
      {
        exerciseId: "",
        dayOfWeek: "monday",
        sets: 3,
        reps: "10",
        weight: 0,
        notes: "",
      },
    ]);
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...planExercises];
    updated[index] = { ...updated[index], [field]: value };
    setPlanExercises(updated);
  };

  const removeExercise = (index: number) => {
    setPlanExercises(planExercises.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || planExercises.length === 0) {
      toast.error("Nome do plano e pelo menos um exercício são obrigatórios");
      return;
    }

    try {
      const validExercises = planExercises.filter(ex => ex.exerciseId);
      
      if (editingId) {
        await updatePlan({
          id: editingId as any,
          name: planName,
          exercises: validExercises,
        });
        toast.success("Plano atualizado!");
        setEditingId(null);
      } else {
        await createPlan({
          name: planName,
          exercises: validExercises,
        });
        toast.success("Plano criado!");
        setIsCreating(false);
      }

      setPlanName("");
      setPlanExercises([]);
    } catch (error) {
      toast.error("Erro ao salvar plano");
    }
  };

  const handleEdit = (planId: string) => {
    const plan = workoutPlans.find(p => p._id === planId);
    if (plan) {
      setEditingId(planId);
      setPlanName(plan.name);
      setPlanExercises(plan.exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId,
        dayOfWeek: ex.dayOfWeek,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight || 0,
        notes: ex.notes || "",
      })));
      setIsCreating(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este plano?")) {
      try {
        await removePlan({ id: id as any });
        toast.success("Plano excluído!");
      } catch (error) {
        toast.error("Erro ao excluir plano");
      }
    }
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setPlanName("");
    setPlanExercises([]);
  };

  const groupExercisesByDay = (exercises: any[]) => {
    const grouped: Record<string, any[]> = {};
    exercises.forEach(ex => {
      if (!grouped[ex.dayOfWeek]) grouped[ex.dayOfWeek] = [];
      grouped[ex.dayOfWeek].push(ex);
    });
    return grouped;
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">
            {workoutPlans.length} ficha{workoutPlans.length !== 1 ? 's' : ''} de treino
          </h3>
          <p className="text-sm text-gray-400">Organize seus treinos por dias da semana</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">+</span>
          Nova Ficha
        </button>
      </div>

      {/* Form */}
      {isCreating && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4 text-white">
            {editingId ? "Editar Ficha" : "Nova Ficha"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Nome da Ficha *</label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white placeholder-gray-400"
                placeholder="Ex: Treino A/B/C, Push/Pull/Legs"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-300">Exercícios</label>
                <button
                  type="button"
                  onClick={addExercise}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  + Adicionar Exercício
                </button>
              </div>

              <div className="space-y-4">
                {planExercises.map((exercise, index) => (
                  <div key={index} className="border border-gray-600 p-4 rounded-lg bg-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-300">Exercício</label>
                        <select
                          value={exercise.exerciseId}
                          onChange={(e) => updateExercise(index, "exerciseId", e.target.value)}
                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-600 text-white"
                        >
                          <option value="">Selecione...</option>
                          {exercises.map((ex) => (
                            <option key={ex._id} value={ex._id}>
                              {ex.name} ({ex.muscleGroup})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-300">Dia</label>
                        <select
                          value={exercise.dayOfWeek}
                          onChange={(e) => updateExercise(index, "dayOfWeek", e.target.value)}
                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-600 text-white"
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-300">Séries</label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, "sets", parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-600 text-white"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-300">Repetições</label>
                        <input
                          type="text"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, "reps", e.target.value)}
                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-600 text-white placeholder-gray-400"
                          placeholder="Ex: 8-12"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-300">Carga (kg)</label>
                        <input
                          type="number"
                          value={exercise.weight}
                          onChange={(e) => updateExercise(index, "weight", parseFloat(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-600 text-white"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-300">Observações</label>
                        <input
                          type="text"
                          value={exercise.notes}
                          onChange={(e) => updateExercise(index, "notes", e.target.value)}
                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-600 text-white placeholder-gray-400"
                          placeholder="Ex: Descanso 60s, Cadência lenta"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remover exercício
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? "Atualizar" : "Criar"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      {workoutPlans.length > 0 ? (
        <div className="space-y-6">
          {workoutPlans.map((plan) => {
            const groupedExercises = groupExercisesByDay(plan.exercises);
            
            return (
              <div key={plan._id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-semibold text-white">{plan.name}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(plan._id)}
                      className="text-blue-400 hover:text-blue-300 text-sm py-2 px-3 border border-blue-400 rounded hover:bg-blue-400/10 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(plan._id)}
                      className="text-red-400 hover:text-red-300 text-sm py-2 px-3 border border-red-400 rounded hover:bg-red-400/10 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayExercises = groupedExercises[day.value] || [];
                    if (dayExercises.length === 0) return null;

                    return (
                      <div key={day.value} className="bg-gray-700 p-4 rounded-lg">
                        <h5 className="font-medium text-white mb-3 flex items-center">
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">
                            {day.short}
                          </span>
                          {day.label}
                        </h5>
                        <div className="space-y-3">
                          {dayExercises.map((exercise, index) => {
                            const exerciseData = exercises.find(ex => ex._id === exercise.exerciseId);
                            return (
                              <div key={index} className="text-sm bg-gray-600 p-3 rounded">
                                <div className="font-medium text-white mb-1">{exerciseData?.name}</div>
                                <div className="text-gray-300 text-xs mb-1">
                                  {exercise.sets} séries × {exercise.reps} reps
                                  {exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                                </div>
                                {exercise.notes && (
                                  <div className="text-gray-400 text-xs">{exercise.notes}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-white mb-2">Nenhuma ficha de treino criada</h3>
          <p className="text-gray-400 mb-6">Crie fichas organizadas por dias da semana para estruturar seus treinos</p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar Primeira Ficha
          </button>
        </div>
      )}
    </div>
  );
}
