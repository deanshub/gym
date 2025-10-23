import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ProgressPhoto {
	id: string;
	filename: string;
	filepath: string;
	createdAt: string;
}

export function ProgressPhotos() {
	const [isUploading, setIsUploading] = useState(false);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [showCamera, setShowCamera] = useState(false);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
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

	const handleCameraCapture = async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "user" },
			});
			setStream(mediaStream);
			setShowCamera(true);
		} catch (error) {
			console.error("Error accessing camera:", error);
			alert("Camera access denied or not available");
		}
	};

	const handleTakePhoto = () => {
		if (!videoRef.current || !stream) return;

		const canvas = document.createElement("canvas");
		canvas.width = videoRef.current.videoWidth;
		canvas.height = videoRef.current.videoHeight;
		const ctx = canvas.getContext("2d");
		ctx?.drawImage(videoRef.current, 0, 0);

		canvas.toBlob(
			(blob) => {
				if (blob) {
					const url = URL.createObjectURL(blob);
					setCapturedImage(url);
					handleCloseCamera();
				}
			},
			"image/jpeg",
			0.8,
		);
	};

	const handleCloseCamera = () => {
		if (stream) {
			stream.getTracks().forEach((track) => {
				track.stop();
			});
			setStream(null);
		}
		setShowCamera(false);
	};

	useEffect(() => {
		if (showCamera && stream && videoRef.current) {
			videoRef.current.srcObject = stream;
		}
	}, [showCamera, stream]);

	const handleApproveUpload = async () => {
		if (!capturedImage) return;

		setIsUploading(true);
		try {
			const response = await fetch(capturedImage);
			const blob = await response.blob();

			const formData = new FormData();
			formData.append("photo", blob, `progress_${Date.now()}.jpg`);

			await fetch("/api/progress-photos", {
				method: "POST",
				body: formData,
			});

			mutate("/api/progress-photos");
			setCapturedImage(null);
			URL.revokeObjectURL(capturedImage);
		} catch (error) {
			console.error("Error uploading photo:", error);
		} finally {
			setIsUploading(false);
		}
	};

	const handleDiscardPhoto = () => {
		if (capturedImage) {
			URL.revokeObjectURL(capturedImage);
			setCapturedImage(null);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">Progress Photos</h3>
				<p className="text-sm text-gray-600 mb-4">
					Upload photos to track your fitness progress over time.
				</p>

				<div className="space-y-4">
					<div className="flex items-center gap-4">
						<Input
							type="file"
							accept="image/*"
							capture="environment"
							onChange={handleFileUpload}
							disabled={isUploading}
							className="flex-1"
						/>
						{isUploading && (
							<span className="text-sm text-gray-500">Uploading...</span>
						)}
					</div>

					<div className="text-center">
						<span className="text-sm text-gray-500">or</span>
					</div>

					{typeof navigator !== "undefined" &&
					navigator.mediaDevices &&
					"getUserMedia" in navigator.mediaDevices ? (
						<Button
							onClick={handleCameraCapture}
							disabled={isUploading}
							className="w-full h-11"
							variant="outline"
						>
							<Camera size={16} />
							Take Photo with Camera
						</Button>
					) : null}
				</div>
			</div>

			{capturedImage && (
				<div className="bg-gray-50 p-4 rounded-lg">
					<h4 className="font-medium mb-4">Review Your Photo</h4>
					<div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 w-full">
						<img
							src={capturedImage}
							alt="Captured progress"
							className="w-full h-full object-cover"
						/>
					</div>
					<div className="flex gap-2 justify-center">
						<Button
							onClick={handleApproveUpload}
							disabled={isUploading}
							className="px-6"
						>
							{isUploading ? "Uploading..." : "✓ Upload Photo"}
						</Button>
						<Button
							onClick={handleDiscardPhoto}
							variant="outline"
							disabled={isUploading}
							className="px-6"
						>
							✗ Discard
						</Button>
					</div>
				</div>
			)}

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

			{showCamera && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
					<div className="bg-white p-4 rounded-lg w-full mx-4">
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className="w-full h-96 rounded mb-4"
						/>
						<div className="flex gap-2 justify-center">
							<Button onClick={handleTakePhoto} className="h-11">
								<Camera size={16} />
								Take Photo
							</Button>
							<Button
								onClick={handleCloseCamera}
								variant="outline"
								className="h-11"
							>
								<X size={16} />
								Cancel
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
