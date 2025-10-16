import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { write } from "bun";
import { prisma } from "../lib/prisma";

const PHOTOS_DIR = process.env.PHOTOS_DIR || "/data/uploads/photos";

export const progressPhotosRoutes = {
	// Get all progress photos
	"/progress-photos": {
		async GET() {
			const photos = await prisma.progressPhoto.findMany({
				orderBy: { createdAt: "desc" },
			});

			return Response.json(photos);
		},

		async POST(req: Request) {
			try {
				const formData = await req.formData();
				const file = formData.get("photo") as File;

				if (!file) {
					return Response.json({ error: "No file provided" }, { status: 400 });
				}

				// Ensure upload directory exists
				await mkdir(PHOTOS_DIR, { recursive: true });

				// Generate unique filename
				const timestamp = Date.now();
				const extension = file.name.split(".").pop() || "jpg";
				const filename = `progress_${timestamp}.${extension}`;
				const filepath = join(PHOTOS_DIR, filename);

				// Save file
				const buffer = await file.arrayBuffer();
				await write(filepath, new Uint8Array(buffer));

				// Save to database
				const id = `photo_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
				const photo = await prisma.progressPhoto.create({
					data: {
						id,
						filename: file.name,
						filepath: `/uploads/photos/${filename}`,
					},
				});

				return Response.json(photo);
			} catch (_error) {
				console.error("Error uploading photo:", _error);
				return Response.json({ error: "Upload failed" }, { status: 500 });
			}
		},
	},

	// Serve uploaded photos
	"/uploads/photos/:filename": {
		async GET(req: { params: { filename: string } }) {
			try {
				const { filename } = req.params;
				const filepath = join(PHOTOS_DIR, filename);
				const file = Bun.file(filepath);

				if (!(await file.exists())) {
					return new Response("File not found", { status: 404 });
				}

				return new Response(file);
			} catch (_error) {
				return new Response("Error serving file", { status: 500 });
			}
		},
	},
};
