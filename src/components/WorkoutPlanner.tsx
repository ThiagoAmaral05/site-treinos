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

// Componente para visualizar detalhes de uma ficha
function PlanDetailView({ planId, exercises, onBack, onEdit, onDelete }: {
  planId: string;
  exercises: any[];
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const planDetails = useQuery(api.workoutPlans.get, { id: planId as any });

  if (!planDetails) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const getDayLabel = (dayValue: string) => {
    return DAYS_OF_WEEK.find(d => d.value === dayValue)?.label || dayValue;
  };

  const getDayShort = (dayValue: string) => {
    return DAYS_OF_WEEK.find(d => d.value === dayValue)?.short || dayValue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span className="mr-2">←</span>
            Voltar às Fichas
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(planId)}
              className="text-blue-400 hover:text-blue-300 text-sm py-2 px-3 border border-blue-400 rounded hover:bg-blue-400/10 transition-colors"
            >
              Editar Ficha
            </button>
            <button
              onClick={() => onDelete(planId)}
              className="text-red-400 hover:text-red-300 text-sm py-2 px-3 border border-red-400 rounded hover:bg-red-400/10 transition-colors"
            >
              Excluir Ficha
            </button>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">{planDetails.name}</h2>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
          <span>{planDetails.exercises.length} exercícios</span>
          {planDetails.exercises.length > 0 && (
            <span className="flex items-center">
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">
                {getDayShort(planDetails.exercises[0].dayOfWeek)}
              </span>
              {getDayLabel(planDetails.exercises[0].dayOfWeek)}
            </span>
          )}
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planDetails.exercises.map((planExercise, index) => {
          const exercise = planExercise.exercise;
          return (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
              {/* Exercise Header */}
              <div className="flex items-start gap-4 mb-4">
                {exercise?.imageUrl && (
                  <img
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg mb-1">{exercise?.name}</h4>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                    {exercise?.muscleGroup}
                  </span>
                </div>
              </div>

              {/* Exercise Description */}
              {exercise?.description && (
                <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-300">{exercise.description}</p>
                </div>
              )}

              {/* Exercise Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-700 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">{planExercise.sets}</div>
                    <div className="text-xs text-gray-400">Séries</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">{planExercise.reps}</div>
                    <div className="text-xs text-gray-400">Repetições</div>
                  </div>
                </div>
                
                {planExercise.weight && planExercise.weight > 0 && (
                  <div className="bg-gray-700 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-400">{planExercise.weight}kg</div>
                    <div className="text-xs text-gray-400">Carga Sugerida</div>
                  </div>
                )}
              </div>

              {/* Exercise Notes */}
              {planExercise.notes && (
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                  <p className="text-sm text-yellow-200">💡 {planExercise.notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WorkoutPlanner() {
  const exercises = useQuery(api.exercises.list) || [];
  const workoutPlans = useQuery(api.workoutPlans.list) || [];
  const createPlan = useMutation(api.workoutPlans.create);
  const updatePlan = useMutation(api.workoutPlans.update);
  const removePlan = useMutation(api.workoutPlans.remove);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [planDayOfWeek, setPlanDayOfWeek] = useState("monday");
  const [planExercises, setPlanExercises] = useState<any[]>([]);

  const addExercise = () => {
    setPlanExercises([
      ...planExercises,
      {
        exerciseId: "",
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
      const validExercises = planExercises.filter(ex => ex.exerciseId).map(ex => ({
        ...ex,
        dayOfWeek: planDayOfWeek
      }));
      
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
      setPlanDayOfWeek("monday");
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
      setPlanDayOfWeek(plan.exercises[0]?.dayOfWeek || "monday");
      setPlanExercises(plan.exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight || 0,
        notes: ex.notes || "",
      })));
      setIsCreating(true);
      setViewingPlanId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este plano?")) {
      try {
        await removePlan({ id: id as any });
        toast.success("Plano excluído!");
        setViewingPlanId(null);
      } catch (error) {
        toast.error("Erro ao excluir plano");
      }
    }
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setPlanName("");
    setPlanDayOfWeek("monday");
    setPlanExercises([]);
  };

  const handleViewPlan = (planId: string) => {
    setViewingPlanId(planId);
  };

  const handleBackToList = () => {
    setViewingPlanId(null);
  };

  const getDayLabel = (dayValue: string) => {
    return DAYS_OF_WEEK.find(d => d.value === dayValue)?.label || dayValue;
  };

  const getDayShort = (dayValue: string) => {
    return DAYS_OF_WEEK.find(d => d.value === dayValue)?.short || dayValue;
  };

  // Se estiver visualizando uma ficha específica
  if (viewingPlanId) {
    return (
      <PlanDetailView 
        planId={viewingPlanId}
        exercises={exercises}
        onBack={handleBackToList}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Nome da Ficha *</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Ex: Treino de Peito, Treino de Pernas"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Dia da Semana *</label>
                <select
                  value={planDayOfWeek}
                  onChange={(e) => setPlanDayOfWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                  required
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
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
                      <div className="md:col-span-2 lg:col-span-1">
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
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-medium mb-1 text-gray-300">Observações</label>
                      <input
                        type="text"
                        value={exercise.notes}
                        onChange={(e) => updateExercise(index, "notes", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-600 text-white placeholder-gray-400"
                        placeholder="Ex: Descanso 60s, Cadência lenta"
                      />
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

      {/* Plans Grid */}
      {workoutPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workoutPlans.map((plan) => (
            <div 
              key={plan._id} 
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer group"
              onClick={() => handleViewPlan(plan._id)}
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {plan.name}
                </h4>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(plan._id)}
                    className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-400/10 transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10 transition-colors"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total de exercícios:</span>
                  <span className="text-white font-medium">{plan.exercises.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Dia da semana:</span>
                  <span className="flex items-center">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">
                      {getDayShort(plan.exercises[0]?.dayOfWeek)}
                    </span>
                    <span className="text-white font-medium text-xs">
                      {getDayLabel(plan.exercises[0]?.dayOfWeek)}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400 group-hover:text-blue-400 transition-colors flex items-center">
                  <span>Clique para ver detalhes</span>
                  <span className="ml-2">→</span>
                </div>
              </div>
            </div>
          ))}
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