import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Exercise, Program } from "@prisma/client";
import { ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Suspense } from "react";
import useSWR from "swr";
import {
	formatMuscleGroup,
	getWeightTypeIcon,
	orderMuscleGroups,
	parseGroupOrder,
} from "../lib/utils";
import { Button } from "./ui/button";

interface ProgramExercisesProps {
	program: Program;
	onEditExercise: (exercise: Exercise) => void;
	onDeleteExercise: (programId: string, exerciseId: string) => void;
	onReorderGroups: (program: Program, newOrder: string[]) => void;
}

interface SortableGroupProps {
	muscleGroup: string;
	exercises: Exercise[];
	programId: string;
	onEditExercise: (exercise: Exercise) => void;
	onDeleteExercise: (programId: string, exerciseId: string) => void;
}

/** A draggable muscle-group section: a grip handle reorders the whole block. */
function SortableGroup({
	muscleGroup,
	exercises,
	programId,
	onEditExercise,
	onDeleteExercise,
}: SortableGroupProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: muscleGroup });

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			className={`border-l-4 border-blue-200 pl-4 ${
				isDragging ? "opacity-60" : ""
			}`}
		>
			<div className="flex items-center gap-1 mb-2">
				<button
					type="button"
					className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-gray-400 hover:text-gray-600 active:cursor-grabbing"
					aria-label={`Reorder ${formatMuscleGroup(muscleGroup)}`}
					{...attributes}
					{...listeners}
				>
					<GripVertical size={16} />
				</button>
				<h4 className="text-sm font-medium text-blue-700">
					{formatMuscleGroup(muscleGroup)}
				</h4>
			</div>
			<div className="space-y-2">
				{exercises.map((exercise) => (
					<div
						key={exercise.id}
						className="flex items-center p-2 bg-gray-50 rounded"
					>
						{exercise.link ? (
							<a
								href={exercise.link}
								target="_blank"
								rel="noopener noreferrer"
								className="flex-1 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
							>
								{exercise.name}
								<ExternalLink size={12} className="shrink-0" />
							</a>
						) : (
							<span className="flex-1">{exercise.name}</span>
						)}
						<div className="flex gap-4">
							<span className="flex flex-col items-center">
								<div className="text-sm font-semibold">{exercise.sets}</div>
								<div className="text-xs text-gray-600 capitalize">sets</div>
							</span>
							<span className="flex flex-col items-center">
								<div className="text-sm font-semibold">{exercise.reps}</div>
								<div className="text-xs text-gray-600 capitalize">reps</div>
							</span>
							<span className="flex flex-col items-center">
								<div className="">
									{getWeightTypeIcon(exercise.weightType, 12)}
								</div>
								<div className="text-sm font-semibold">
									{exercise.weight}
									<small className="text-xs text-gray-600">kg</small>
								</div>
							</span>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onEditExercise(exercise)}
							aria-label={`Edit ${exercise.name}`}
						>
							<Pencil size={12} />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDeleteExercise(programId, exercise.id)}
							aria-label={`Delete ${exercise.name}`}
						>
							<Trash2 size={12} />
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}

function ExercisesList({
	program,
	onEditExercise,
	onDeleteExercise,
	onReorderGroups,
}: ProgramExercisesProps) {
	const { data: exercises = [] } = useSWR<Exercise[]>(
		`/api/programs/${program.id}/exercises`,
	);

	const sensors = useSensors(
		// A small activation distance keeps taps on the handle from starting a
		// drag; a dedicated handle already isolates dragging from the exercise
		// edit/delete buttons.
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	if (exercises.length === 0) {
		return <p className="text-gray-500">No exercises added</p>;
	}

	// Group exercises by muscle group, tracking first-seen order for groups the
	// saved order doesn't mention.
	const exercisesByMuscleGroup = new Map<string, Exercise[]>();
	for (const exercise of exercises) {
		const group = exercise.group;
		if (!exercisesByMuscleGroup.has(group)) {
			exercisesByMuscleGroup.set(group, []);
		}
		exercisesByMuscleGroup.get(group)?.push(exercise);
	}

	const groupOrder = orderMuscleGroups(
		[...exercisesByMuscleGroup.keys()],
		parseGroupOrder(program.muscleGroupOrder),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = groupOrder.indexOf(String(active.id));
		const newIndex = groupOrder.indexOf(String(over.id));
		if (oldIndex === -1 || newIndex === -1) return;
		onReorderGroups(program, arrayMove(groupOrder, oldIndex, newIndex));
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={groupOrder}
				strategy={verticalListSortingStrategy}
			>
				<div className="space-y-4">
					{groupOrder.map((muscleGroup) => (
						<SortableGroup
							key={muscleGroup}
							muscleGroup={muscleGroup}
							exercises={exercisesByMuscleGroup.get(muscleGroup) ?? []}
							programId={program.id}
							onEditExercise={onEditExercise}
							onDeleteExercise={onDeleteExercise}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

export function ProgramExercises({
	program,
	onEditExercise,
	onDeleteExercise,
	onReorderGroups,
}: ProgramExercisesProps) {
	return (
		<Suspense fallback={<p className="text-gray-400">Loading exercises...</p>}>
			<ExercisesList
				program={program}
				onEditExercise={onEditExercise}
				onDeleteExercise={onDeleteExercise}
				onReorderGroups={onReorderGroups}
			/>
		</Suspense>
	);
}
