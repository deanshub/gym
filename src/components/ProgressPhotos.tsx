import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Input } from "./ui/input";

interface ProgressPhoto {
	id: string;
	filename: string;
	filepath: string;
	createdAt: string;
}

export function ProgressPhotos() {
	const [isUploading, setIsUploading] = useState(false);
	const { data: photos = [] } = useSWR<ProgressPhoto[]>("/api/progress-photos");

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("photo", file);

			await fetch("/api/progress-photos", {
				method: "POST",
				body: formData,
			});

			mutate("/api/progress-photos");
			e.target.value = ""; // Reset input
		} catch (error) {
			console.error("Error uploading photo:", error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">Progress Photos</h3>
				<p className="text-sm text-gray-600 mb-4">
					Upload photos to track your fitness progress over time.
				</p>

				<div className="flex items-center gap-4">
					<Input
						type="file"
						accept="image/*"
						onChange={handleFileUpload}
						disabled={isUploading}
						className="flex-1"
					/>
					{isUploading && (
						<span className="text-sm text-gray-500">Uploading...</span>
					)}
				</div>
			</div>

			{photos.length > 0 && (
				<div>
					<h4 className="font-medium mb-4">
						Your Progress ({photos.length} photos)
					</h4>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{photos.map((photo) => (
							<div key={photo.id} className="space-y-2">
								<div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
									<img
										src={`/api${photo.filepath}`}
										alt={`Progress from ${new Date(photo.createdAt).toLocaleDateString()}`}
										className="w-full h-full object-cover"
									/>
								</div>
								<p className="text-xs text-gray-600 text-center">
									{new Date(photo.createdAt).toLocaleDateString()}
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{photos.length === 0 && (
				<div className="text-center py-8 text-gray-500">
					<p>No progress photos yet.</p>
					<p className="text-sm">
						Upload your first photo to start tracking your progress!
					</p>
				</div>
			)}
		</div>
	);
}
