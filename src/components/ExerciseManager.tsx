import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", 
  "Pernas", "Glúteos", "Abdômen", "Cardio"
];

export function ExerciseManager() {
  const exercises = useQuery(api.exercises.list) || [];
  const createExercise = useMutation(api.exercises.create);
  const updateExercise = useMutation(api.exercises.update);
  const removeExercise = useMutation(api.exercises.remove);
  const generateUploadUrl = useMutation(api.exercises.generateUploadUrl);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    muscleGroup: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.muscleGroup) {
      toast.error("Nome e grupo muscular são obrigatórios");
      return;
    }

    try {
      let imageId = undefined;

      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const json = await result.json();
        if (!result.ok) throw new Error("Upload failed");
        imageId = json.storageId;
      }

      if (editingId) {
        await updateExercise({
          id: editingId as any,
          ...formData,
          imageId,
        });
        toast.success("Exercício atualizado!");
        setEditingId(null);
      } else {
        await createExercise({
          ...formData,
          imageId,
        });
        toast.success("Exercício criado!");
        setIsCreating(false);
      }

      setFormData({ name: "", description: "", muscleGroup: "" });
      setSelectedImage(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (error) {
      toast.error("Erro ao salvar exercício");
    }
  };

  const handleEdit = (exercise: any) => {
    setEditingId(exercise._id);
    setFormData({
      name: exercise.name,
      description: exercise.description || "",
      muscleGroup: exercise.muscleGroup,
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este exercício?")) {
      try {
        await removeExercise({ id: id as any });
        toast.success("Exercício excluído!");
      } catch (error) {
        toast.error("Erro ao excluir exercício");
      }
    }
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: "", description: "", muscleGroup: "" });
    setSelectedImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">
            {exercises.length} exercício{exercises.length !== 1 ? 's' : ''} cadastrado{exercises.length !== 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-gray-400">Gerencie sua biblioteca de exercícios</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">+</span>
          Novo Exercício
        </button>
      </div>

      {/* Form */}
      {isCreating && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4 text-white">
            {editingId ? "Editar Exercício" : "Novo Exercício"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Ex: Supino reto"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Grupo Muscular *</label>
                <select
                  value={formData.muscleGroup}
                  onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                  required
                >
                  <option value="">Selecione...</option>
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white placeholder-gray-400"
                rows={3}
                placeholder="Descreva como executar o exercício..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Imagem</label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
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

      {/* Exercise Grid */}
      {exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <div key={exercise._id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
              {exercise.imageUrl && (
                <img
                  src={exercise.imageUrl}
                  alt={exercise.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg text-white">{exercise.name}</h4>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                    {exercise.muscleGroup}
                  </span>
                </div>
                {exercise.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{exercise.description}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(exercise)}
                    className="flex-1 text-blue-400 hover:text-blue-300 text-sm py-2 px-3 border border-blue-400 rounded hover:bg-blue-400/10 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(exercise._id)}
                    className="flex-1 text-red-400 hover:text-red-300 text-sm py-2 px-3 border border-red-400 rounded hover:bg-red-400/10 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-6xl mb-4">🏋️</div>
          <h3 className="text-lg font-medium text-white mb-2">Nenhum exercício cadastrado</h3>
          <p className="text-gray-400 mb-6">Comece criando seus primeiros exercícios para montar suas fichas de treino</p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar Primeiro Exercício
          </button>
        </div>
      )}
    </div>
  );
}
